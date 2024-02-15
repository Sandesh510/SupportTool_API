const app = require("./app");
// const PORT = process.env.PORT;
const PORT = 3005;

app.listen(PORT, () => {
  console.log(`server is live from ${PORT}`);
});
