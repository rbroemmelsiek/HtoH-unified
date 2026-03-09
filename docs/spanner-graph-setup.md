# Spanner Graph setup (htoh-3-0)

Spanner Graph is **expensive** in production. Use the **90-day free trial** to evaluate.

## Cost and free trial

- **Enable API only = no cost:** Enabling the Spanner API alone incurs **no charges**. Billing only applies once you create an instance (free trial or paid). You can enable the API now and create an instance later when you need Spanner Graph.
- **Free trial:** [Spanner free trial instances](https://cloud.google.com/spanner/docs/free-trial-instance) — 90 days, up to 10 GB. Supports **Enterprise** edition (Spanner Graph). One free trial instance per project; max 5 per billing account.
- **After trial:** You are charged for compute (per node/second) and storage. Spanner Graph requires **Enterprise** or **Enterprise Plus** edition. See [Spanner pricing](https://cloud.google.com/spanner/pricing) and [Spanner editions](https://cloud.google.com/spanner/docs/editions-overview).
- **Recommendation:** Create a **free trial instance** first. Before the trial ends, either delete the instance or convert to paid only if you need it.

## 1. Enable APIs and create a free trial instance

1. **Enable Spanner API**  
   [Enable Spanner API](https://console.cloud.google.com/flows/enableapi?apiid=spanner.googleapis.com&project=htoh-3-0)

2. **Create a Spanner instance (free trial)**  
   - [Spanner console](https://console.cloud.google.com/spanner/instances?project=htoh-3-0)  
   - If offered, choose **Start with a free trial instance** (90 days, 10 GB).  
   - Otherwise: Create instance → **Enterprise** or **Enterprise Plus** (required for Graph).  
   - **Instance ID:** e.g. `htoh-graph-trial`  
   - **Region:** e.g. `us-central1`  
   - **Compute:** 1000 PUs (or minimum allowed for trial).  
   - Create.

3. **Create a database with a graph schema**  
   - Open the instance → **Create database**.  
   - **Database ID:** e.g. `htoh-graph-db`.  
   - **Dialect:** Google Standard SQL (not PostgreSQL).  
   - In DDL, paste a schema that defines tables and a **property graph**. Example (from Google’s docs):

```sql
CREATE TABLE Person (
  id               INT64 NOT NULL,
  name             STRING(MAX),
  birthday         TIMESTAMP,
  country          STRING(MAX),
  city             STRING(MAX),
) PRIMARY KEY (id);

CREATE TABLE Account (
  id               INT64 NOT NULL,
  create_time      TIMESTAMP,
  is_blocked       BOOL,
  nick_name        STRING(MAX),
) PRIMARY KEY (id);

CREATE TABLE PersonOwnAccount (
  id               INT64 NOT NULL,
  account_id       INT64 NOT NULL,
  create_time      TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES Account (id)
) PRIMARY KEY (id, account_id),
  INTERLEAVE IN PARENT Person ON DELETE CASCADE;

CREATE TABLE AccountTransferAccount (
  id               INT64 NOT NULL,
  to_id            INT64 NOT NULL,
  amount           FLOAT64,
  create_time      TIMESTAMP NOT NULL,
  order_number     STRING(MAX),
  FOREIGN KEY (to_id) REFERENCES Account (id)
) PRIMARY KEY (id, to_id, create_time),
  INTERLEAVE IN PARENT Account ON DELETE CASCADE;

CREATE OR REPLACE PROPERTY GRAPH FinGraph
  NODE TABLES (Account, Person)
  EDGE TABLES (
    PersonOwnAccount
      SOURCE KEY (id) REFERENCES Person (id)
      DESTINATION KEY (account_id) REFERENCES Account (id)
      LABEL Owns,
    AccountTransferAccount
      SOURCE KEY (id) REFERENCES Account (id)
      DESTINATION KEY (to_id) REFERENCES Account (id)
      LABEL Transfers
  );
```

   - Create the database.

## 2. Configure Functions to use Spanner Graph

In **functions** (emulator or deployed), set:

- `SPANNER_INSTANCE` — instance ID (e.g. `htoh-graph-trial`).  
- `SPANNER_DATABASE` — database ID (e.g. `htoh-graph-db`).  
- Optional: `SPANNER_GRAPH_NAME` — graph name (e.g. `FinGraph`) to run a trivial graph query in the ping.

**Local (functions/.env):**

```env
SPANNER_INSTANCE=htoh-graph-trial
SPANNER_DATABASE=htoh-graph-db
SPANNER_GRAPH_NAME=FinGraph
```

**Deployed:** Set the same variables in Firebase Functions config (e.g. `firebase functions:config` or Secret Manager / env in Firebase Console).

## 3. Verify from the app

- **HTTP endpoint:** `GET https://us-central1-htoh-3-0.cloudfunctions.net/spannerGraphPing`  
  - If not configured: `{ "ok": true, "configured": false, "message": "..." }`.  
  - If configured: `{ "ok": true, "configured": true, "spanner": "connected", "graph": "ok" }` (or an error message if the graph name is wrong or missing).

A link to this endpoint is in **Help → Quick Links** (Backend Functions).

## 4. IAM

The identity that runs your code (e.g. Cloud Functions runtime or local ADC) needs at least **Cloud Spanner Database User** (or **Database Reader** for read-only) on the database. For a free trial instance created in the same project, the default compute/Functions service account often already has access; if not, grant the role on the instance or database.

## 5. Cleanup (avoid cost after trial)

- Delete the database and/or instance in [Spanner console](https://console.cloud.google.com/spanner/instances?project=htoh-3-0), or  
- Let the free trial end and do not convert to paid if you no longer need it.

## References

- [Spanner Graph overview](https://cloud.google.com/spanner/docs/graph/overview)  
- [Set up and query Spanner Graph](https://cloud.google.com/spanner/docs/graph/set-up)  
- [Spanner free trial instances](https://cloud.google.com/spanner/docs/free-trial-instance)  
- [Spanner pricing](https://cloud.google.com/spanner/pricing)
