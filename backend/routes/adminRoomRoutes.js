const express = require("express");

const router = express.Router();

const MAX_GALLERY_PHOTOS = 10;

// Keep only http(s) links and store them as a JSON array (or null)
function normalizeGallery(gallery) {
    const list = Array.isArray(gallery) ? gallery : [];

    const urls = list
        .map((url) => String(url || "").trim())
        .filter((url) => /^https?:\/\/\S+$/i.test(url))
        .slice(0, MAX_GALLERY_PHOTOS);

    return urls.length ? JSON.stringify(urls) : null;
}

const db = require("../config/db");
const adminMiddleware = require("../middleware/adminMiddleware");


// GET ALL ROOMS
router.get("/", adminMiddleware, (req, res) => {

    const sql = `
        SELECT *
        FROM rooms
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch rooms."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});


// ADD ROOM
router.post("/", adminMiddleware, (req, res) => {

    const {
        room_number,
        room_name,
        room_type,
        price,
        capacity,
        bed_type,
        room_size,
        description,
        facilities,
        image,
        gallery,
        status
    } = req.body;

    if (
        !room_number ||
        !room_name ||
        !room_type ||
        !price ||
        !capacity
    ) {
        return res.status(400).json({
            success: false,
            message: "Required fields are missing."
        });
    }

    const sql = `
        INSERT INTO rooms
        (
            room_number,
            room_name,
            room_type,
            price,
            capacity,
            bed_type,
            room_size,
            description,
            facilities,
            image,
            gallery,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            room_number,
            room_name,
            room_type,
            price,
            capacity,
            bed_type || null,
            room_size || null,
            description || null,
            facilities || null,
            image || null,
            normalizeGallery(gallery),
            status || "available"
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to add room."
                });
            }

            res.status(201).json({
                success: true,
                message: "Room added successfully!",
                roomId: result.insertId
            });

        }
    );

});


// UPDATE ROOM
router.put("/:id", adminMiddleware, (req, res) => {

    const { id } = req.params;

    const {
        room_number,
        room_name,
        room_type,
        price,
        capacity,
        bed_type,
        room_size,
        description,
        facilities,
        image,
        gallery,
        status
    } = req.body;

    const sql = `
        UPDATE rooms
        SET
            room_number = ?,
            room_name = ?,
            room_type = ?,
            price = ?,
            capacity = ?,
            bed_type = ?,
            room_size = ?,
            description = ?,
            facilities = ?,
            image = ?,
            gallery = ?,
            status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            room_number,
            room_name,
            room_type,
            price,
            capacity,
            bed_type || null,
            room_size || null,
            description || null,
            facilities || null,
            image || null,
            normalizeGallery(gallery),
            status
        ,
            id
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to update room."
                });
            }

            res.json({
                success: true,
                message: "Room updated successfully!"
            });

        }
    );

});


// DELETE ROOM
router.delete("/:id", adminMiddleware, (req, res) => {

    const { id } = req.params;

    const sql = `
        DELETE FROM rooms
        WHERE id = ?
    `;

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to delete room."
            });
        }

        res.json({
            success: true,
            message: "Room deleted successfully!"
        });

    });

});


module.exports = router;