import { body, validationResult } from "express-validator";

export const validateCourse = [
  body("title").notEmpty().withMessage("Title is required."),
  body("description").notEmpty().withMessage("Description is required."),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number."),
  body("category").notEmpty().withMessage("Category is required."),
  body("level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid level value."),
  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Invalid status value."),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
