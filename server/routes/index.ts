import { Response } from "express";

import express from "express";

const router = express.Router();

/* GET home page. */
router.get("/", function (res: Response) {
    res.render("index", { title: "Express" });
});

export default router;
