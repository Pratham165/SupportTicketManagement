const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await pool.query("SELECT 1");
        console.log("DB Connected");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (e) {
        console.error("DB connection failed:", e.message);
    }
})();