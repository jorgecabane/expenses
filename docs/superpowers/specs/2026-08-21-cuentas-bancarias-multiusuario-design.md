# Cuentas bancarias como entidad real — Fase 1

Fecha: 2026-08-21
Estado: aprobado para implementar
Repos: `expenses` (app Bolsillos) y `bank-sync` (agente)

## Problema

Bolsillos sabe que un gasto vino de "santander / credit", pero no de **qué tarjeta**.
Con una sola cuenta corriente y una sola tarjeta eso alcanzaba. No alcanza para:

- Elegir qué productos sincronizar y cuáles no (una línea de crédito no es gasto).
- Mandar la tarjeta adicional a un espacio personal y la cuenta corriente a uno compartido.
- Distinguir una compra en cuotas de un gasto suelto.
- Agregar un segundo banco.

Además hay dos defectos que hoy no se ven porque el único usuario es quien los creó:

1. **El bolsillo "Sin categorizar" está identificado por su nombre en cinco lugares.**
   `app/api/expenses/route.ts:171` lo busca con `name: 'Sin categorizar'` (exacto,
   sensible a mayúsculas) y devuelve error si no existe: **un usuario nuevo no puede
   sincronizar**. En `bank-sync/src/sync.ts:79` el lookup devuelve `undefined` si el
   nombre no coincide, y entonces "Sin categorizar" pasa a contar como voto válido en
   la memoria de comercios: el comercio queda memorizado como "no supe" y nunca vuelve
   a consultarse al modelo. Es una corrupción silenciosa del aprendizaje.

2. **El scraper propio cubre un solo banco.** `open-banking-chile` (MIT) cubre once,
   maneja segundo factor, y modela cuotas y facturado/no-facturado.

## Alcance de la Fase 1

Adoptar la librería de scraping, convertir la cuenta en una entidad de primera clase,
y arreglar el bolsillo del sistema. Las credenciales **no se mueven**: siguen en el
`.env` local del agente.

### Fuera de alcance (y por qué)

- **Sobres cifrados y agente plural (Fase 2).** Son tablas aditivas: agregarlas después
  no modifica `Account` ni `Expense`. Mientras el único usuario sea el dueño de la
  máquina, el cifrado no protege nada que no esté ya protegido por el sistema operativo.
- **Onboarding web de credenciales (Fase 2).** Depende de lo anterior.
- **Bandeja diaria de pendientes (Fase 3).** Necesita volumen para justificarse, y la
  telemetría de esta fase es la que va a decir si hace falta.

## Decisiones de arquitectura

### 1. La librería reemplaza al scraper propio, pero solo si da paridad

`open-banking-chile` llegó a los mismos endpoints de Santander que nosotros por
ingeniería inversa independiente, lo que valida ambas implementaciones. Aun así,
son 534 líneas que nunca corrieron contra esta cuenta.

**El primer paso del plan es comparar su salida contra los 142 movimientos ya
importados.** Si no hay paridad, la fase se detiene y se revisa. No se borra el
scraper propio hasta que la comparación pase.

### 2. El rango de fechas se filtra del lado nuestro

`ScraperOptions` no tiene `from`/`to`: la librería pagina hasta 25 páginas y devuelve
lo que el portal exponga. **"Traer 3 meses" es un recorte nuestro, no un pedido al
banco.** Cuánto historial exista depende de cada banco y no lo controlamos.

Ventana inicial: **90 días**. Suficiente para que la memoria de comercios (2 apariciones
unánimes) arranque con señal, en una sola pasada.

### 3. Una corrida por hora, como máximo

La librería advierte que ejecutar seguido puede hacer que el banco bloquee la cuenta.
El sync diario entra cómodo; iterar en debugging no. El agente debe **rechazar** una
corrida si la anterior fue hace menos de una hora, salvo `--force` explícito.

### 4. El bolsillo del sistema se identifica por slug

`Category` gana `slug` (único por grupo) e `isSystem`. El bolsillo de descarte lleva
`slug: 'uncategorized'`, se crea junto con el grupo, y **el código lo busca por slug,
nunca por nombre**. El usuario puede renombrarlo a "Por revisar" sin romper nada;
no puede borrarlo.

### 5. Se registra cómo se resolvió cada categorización

`Expense.categorizedBy` guarda qué nivel de la cascada resolvió el gasto:
`rule` | `memory` | `model` | `none` | `manual`. Es una columna nullable y permite
responder lo que hoy no podemos: cuántas veces el sistema supo y cuántas se abstuvo,
y si la memoria está creciendo o estancada.

## Modelo de datos

### Nuevo: `BankConnection`

**Pertenece a la persona, no al espacio.** Tus bancos son tuyos: los configurás una vez
y después decidís qué producto alimenta qué espacio. Colgar la conexión de un grupo
obligaría a reconectar el mismo banco en cada espacio y a repetir las credenciales.

```prisma
model BankConnection {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  bank      String   // id de open-banking-chile: "santander", "bchile", ...
  label     String?  // alias del usuario
  status    String   @default("active") // active | needs_reauth | disabled
  lastSyncAt DateTime? @map("last_sync_at")
  createdAt DateTime @default(now()) @map("created_at")

  user     User @relation(fields: [userId], references: [id], onDelete: Cascade)
  accounts BankAccount[]

  @@unique([userId, bank])
  @@map("bank_connections")
}
```

### Nuevo: `BankAccount`

Un producto del banco: cuenta corriente, tarjeta, línea de crédito.

```prisma
model BankAccount {
  id           String  @id @default(cuid())
  connectionId String  @map("connection_id")
  externalKey  String  @map("external_key") // estable: normalización de label + últimos 4
  label        String  // "Cuenta Corriente ****2706"
  kind         String  // checking | credit_card | credit_line
  last4        String? @map("last4")
  owner        String? // titular | adicional
  // A qué espacio van los gastos de este producto. Null = no sincronizar.
  targetGroupId String? @map("target_group_id")
  enabled      Boolean @default(true)
  createdAt    DateTime @default(now()) @map("created_at")

  connection  BankConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  targetGroup FamilyGroup?   @relation(fields: [targetGroupId], references: [id])
  expenses    Expense[]

  @@unique([connectionId, externalKey])
  @@map("bank_accounts")
}
```

`externalKey` se deriva del label normalizado, con el mismo criterio de estabilidad que
usamos para el fingerprint de movimientos: el banco cambia el texto, así que la clave
se calcula sobre la parte que no muta (tipo + últimos 4 dígitos).

### Cambios en `Expense`

```prisma
accountId      String?  @map("account_id")   // -> BankAccount
installment    String?  @map("installment")  // "03/12"
totalAmount    Decimal? @map("total_amount")  // total de la compra en cuotas
billed         Boolean? @map("billed")        // TC: facturado vs no facturado
categorizedBy  String?  @map("categorized_by")
```

`accountType` se mantiene poblada para no romper las vistas de Consumo vs Caja que ya
funcionan. Se deprecia, no se borra. El mapeo desde `kind` es explícito:

| `BankAccount.kind` | `Expense.accountType` | En Consumo | En Caja |
|---|---|---|---|
| `checking` | `checking` | sí | sí |
| `credit_card` | `credit` | sí | no |
| `credit_line` | — | nunca se sincroniza en Fase 1 | — |

La línea de crédito no es un gasto sino deuda disponible: sincronizarla inflaría el
consumo con plata que no se gastó. Queda descubierta y apagada, visible pero inerte.

### Cambios en `Category`

```prisma
slug     String?  // 'uncategorized' para el bolsillo del sistema
isSystem Boolean  @default(false) @map("is_system")

@@unique([groupId, slug])
```

## Flujo de sincronización

```
1. El agente pregunta a Bolsillos: conexiones activas + cuentas habilitadas + reglas
2. Por cada conexión: scrape() con las credenciales del .env local
   -> devuelve accounts[] + creditCards[] con sus movimientos
3. Reconciliar productos descubiertos contra BankAccount (alta de los nuevos como
   enabled=false: nada se sincroniza sin que el usuario lo decida)
4. Filtrar movimientos: solo cuentas enabled, ventana de 90 días
5. Fingerprint estable (ya existe) -> descartar externalId conocidos
6. Cascada de categorización: regla -> memoria -> modelo, registrando categorizedBy
7. POST en paralelo (6 en vuelo) al espacio que corresponde a cada cuenta
```

El paso 3 es la clave del onboarding: **el descubrimiento es un efecto secundario del
scrape normal**, no un modo especial. Un producto nuevo aparece apagado y el usuario lo
enciende cuando quiere.

## Migración de datos

1. Crear las tablas nuevas.
2. `Category`: agregar `slug`/`isSystem`; marcar el bolsillo existente con
   `slug='uncategorized'`, `isSystem=true`.
3. Crear la `BankConnection` de Santander y dos `BankAccount` derivadas del
   `accountType` actual (`checking` y `credit_card`), apuntando al espacio activo.
4. Backfill de `Expense.accountId` según `accountType`.
5. Verificar: cero `Expense` con `bank` no nulo y `accountId` nulo.

Los `externalId` de movimientos **no se tocan**: el fingerprint no cambia en esta fase.

## Criterios de aceptación

1. **Paridad del scraper.** La librería devuelve los mismos movimientos que el scraper
   propio para la misma ventana, comparados por fingerprint. Bloqueante.
2. **Usuario nuevo sincroniza.** Un grupo recién creado tiene el bolsillo del sistema y
   acepta un POST sin `categoryId` sin devolver error.
3. **Renombrar no rompe.** Cambiar el nombre del bolsillo del sistema a "Por revisar"
   deja la memoria de comercios intacta y sigue sin contarlo como voto.
4. **Borrar está bloqueado.** La API rechaza borrar una categoría con `isSystem=true`.
5. **Selección por cuenta.** Apagar un producto detiene los movimientos nuevos y
   conserva el historial ya importado.
6. **Cuotas.** Una compra en cuotas guarda `installment` y `totalAmount`.
7. **Telemetría.** Después de un sync, `categorizedBy` permite contar cuántos resolvió
   cada nivel de la cascada.
8. **Límite horario.** Una segunda corrida dentro de la hora se rechaza sin abrir Chrome.
9. Typecheck, `npm run check` y build verdes en ambos repos.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La librería no da paridad en Santander | Es el primer paso y es bloqueante; el scraper propio no se borra hasta que pase |
| Madurez despareja entre bancos (962 líneas Falabella vs 241 Edwards) | Fase 1 solo habilita Santander; los demás se activan de a uno con verificación propia |
| El banco bloquea la cuenta por exceso de corridas | Límite de 1/hora aplicado en el agente, no solo documentado |
| Segundo factor rompe el sync desatendido | Documentado como limitación real; el cron queda apagado por defecto |
| El backfill de `accountId` deja gastos huérfanos | Criterio de aceptación explícito verifica cero huérfanos |

## Fases siguientes (documentadas, no construidas)

**Fase 2 — Multiusuario.** `Agent` (nombre, llave pública, última vez visto) y
`CredentialEnvelope` (credencial cifrada para un agente específico). El navegador cifra
con la llave pública del agente; el servidor solo transporta. Migrar de máquina =
el agente viejo re-sella el sobre para el nuevo, sin que el servidor vea texto plano.
Ambas tablas son aditivas.

**Fase 3 — Bandeja diaria.** Pantalla de pendientes con confirmación en un toque, al
estilo de la de Ualet. La telemetría de `categorizedBy` de la Fase 1 dirá si el volumen
de abstenciones la justifica.

## Nota sobre el copy

El onboarding **no debe afirmar** que nadie más puede leer las credenciales mientras
esa propiedad no esté construida y no esté decidido el destino final del agente.
Kane hoy dice en su landing que nunca guarda credenciales en sus servidores y en sus
Términos que las almacena encriptadas: quedaron atrapados en su propio copy. La frase
segura es "solo tu agente autorizado puede abrirlas", verdadera en las tres etapas.
