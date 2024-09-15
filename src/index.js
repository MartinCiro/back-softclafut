const app = require("./app.js");

const port = app.get("port") || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
  