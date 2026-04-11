import { z } from "zod";
import {
  MAX_FILE_SIZE,
  ACCEPTED_PDF_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "./constants";

export const UploadSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب").max(100, "العنوان طويل جداًا"),
  author: z
    .string()
    .min(1, "اسم المؤلف مطلوب")
    .max(100, "اسم المؤلف طويل جداًا"),
  persona: z.string().min(1, "يرجى اختيار صوت"),
  pdfFile: z
    .instanceof(File, { message: "ملف PDF مطلوب" })
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "يجب أن يكون حجم الملف أقل من 50 ميجابايت",
    )
    .refine(
      (file) => ACCEPTED_PDF_TYPES.includes(file.type),
      "يتم قبول ملفات PDF فقط",
    ),
  coverImage: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_IMAGE_SIZE,
      "يجب أن يكون حجم الصورة أقل من 10 ميجابايت",
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "تـُدعم فقط صيغ .jpg و .jpeg و .png و .webp",
    ),
});
