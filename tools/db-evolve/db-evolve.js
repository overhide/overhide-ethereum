/**
 * Database evolution script for overhide-ledger.
 */

const POSTGRES_HOST = process.env.POSTGRES_HOST || process.env.npm_config_POSTGRES_HOST || process.env.npm_package_config_POSTGRES_HOST || 'localhost'
const POSTGRES_PORT = process.env.POSTGRES_PORT || process.env.npm_config_POSTGRES_PORT || process.env.npm_package_config_POSTGRES_PORT || 5432
const POSTGRES_DB = process.env.POSTGRES_DB || process.env.npm_config_POSTGRES_DB || process.env.npm_package_config_POSTGRES_DB || 'oh-eth';
const POSTGRES_USER = process.env.POSTGRES_USER || process.env.npm_config_POSTGRES_USER || process.env.npm_package_config_POSTGRES_USER || 'adam';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || process.env.npm_config_POSTGRES_PASSWORD || process.env.npm_package_config_POSTGRES_PASSWORD || 'c0c0nut';
const POSTGRES_SSL = process.env.POSTGRES_SSL || process.env.npm_config_POSTGRES_SSL || process.env.npm_package_config_POSTGRES_SSL;

let conn_details = {
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  database: POSTGRES_DB,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  ssl: POSTGRES_SSL
};

console.log(JSON.stringify(conn_details,null,2));

const db = new (require('pg').Client)(conn_details);

db.connect();

(async () =>  {
  let result = null;

  result = await db.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'ethstaging'`);
  if (result.rowCount == 0) {
    await db.query(`CREATE TABLE ethstaging (block integer NOT NULL,
                                             fromaddr bytea NULL,
                                             toaddr bytea NULL,
                                             blockts timestamptz NOT NULL,
                                             bkhash bytea NOT NULL,
                                             txhash bytea NOT NULL,
                                             value decimal NOT NULL)`);
    console.log(`created 'ethstaging' table.`);
  }
  await db.query('CREATE UNIQUE INDEX ON ethstaging (fromaddr, toaddr, txhash, value);');
  await db.query('CREATE INDEX ON ethstaging (block);');
  await db.query('CREATE INDEX ON ethstaging (fromaddr);');
  await db.query('CREATE INDEX ON ethstaging (toaddr);');

  result = await db.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'ethtransactions'`);
  if (result.rowCount == 0) {
    await db.query(`CREATE TABLE ethtransactions (block integer NOT NULL,
                                                  fromaddr bytea NULL,
                                                  toaddr bytea NULL,
                                                  transactionts timestamptz NOT NULL,
                                                  txhash bytea NOT NULL,
                                                  value decimal NOT NULL)`);
    console.log(`created 'ethtransactions' table.`);
  }
  await db.query('CREATE UNIQUE INDEX ON ethtransactions (fromaddr, toaddr, txhash, value);');
  await db.query('CREATE INDEX ON ethtransactions (fromaddr);');
  await db.query('CREATE INDEX ON ethtransactions (toaddr);');

  result = await db.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'ethtrackedaddress'`);
  if (result.rowCount == 0) {
    await db.query(`CREATE TABLE ethtrackedaddress (address bytea NULL,
                                                    checked timestamptz NOT NULL)`);
    console.log(`created 'ethtrackedaddress' table.`);
  }
  await db.query('CREATE UNIQUE INDEX ON ethtrackedaddress (address);');

  process.exit(0);

})().catch((err) => {
  console.log(`ERROR: ${err}`);
  console.log(`ERROR: ${JSON.stringify(err,null,2)}`);
});

