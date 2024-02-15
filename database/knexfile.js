module.exports = {
  client: "pg",
  connection: {
    host: "mouse.db.elephantsql.com",
    user: "ntyvztlm", // Replace with your database username
    password: "I0MOf2NBgCm499GsdHFHhWJXGsjVy7DN", // Replace with your database password
    database: "ntyvztlm", // Replace with your database name
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "./database/migrations",
  },
  plugins: ["knex-schema-inspector"],
  useNullAsDefault: true,
};
