"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, ImageIcon } from "lucide-react";
import { UploadSchema } from "@/lib/zod";
import { BookUploadFormValues } from "@/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_PDF_TYPES,
  ACCEPTED_IMAGE_TYPES,
  DEFAULT_VOICE,
} from "@/lib/constants";
import FileUploader from "./FileUploader";
import VoiceSelector from "./VoiceSelector";
import LoadingOverlay from "./LoadingOverlay";
// import {useAuth, useUser} from "@clerk/nextjs";
// import { toast } from 'sonner';
// import {checkBookExists, createBook, saveBookSegments} from "@/lib/actions/book.actions";
// import {useRouter} from "next/navigation";
// import {parsePDFFile} from "@/lib/utils";
// import {upload} from "@vercel/blob/client";

const UploadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // const { userId } = useAuth();
  // const router = useRouter()

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const form = useForm<BookUploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      persona: "",
      //   pdfFile: undefined,
      //   coverImage: undefined,
    },
  });

  const onSubmit = async (values: BookUploadFormValues) => {
    setIsSubmitting(true);
    console.log(values);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsSubmitting(false);
  };

  if (!isMounted) return null;

  return (
    <>
      {isSubmitting && <LoadingOverlay />}

      <div className="new-book-wrapper">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. PDF File Upload */}
            <FileUploader
              control={form.control}
              name="pdfFile"
              label="ملف PDF للكتاب"
              acceptTypes={ACCEPTED_PDF_TYPES}
              icon={Upload}
              placeholder="انقر لتحميل PDF"
              hint="ملف PDF (بحد أقصى 50 ميجابايت)"
              disabled={isSubmitting}
            />

            {/* 2. Cover Image Upload */}
            <FileUploader
              control={form.control}
              name="coverImage"
              label="صورة الغلاف (اختياري)"
              acceptTypes={ACCEPTED_IMAGE_TYPES}
              icon={ImageIcon}
              placeholder="انقر لتحميل صورة الغلاف"
              hint="اترك فارغًا لالتوليد التلقائي من PDF"
              disabled={isSubmitting}
            />

            {/* 3. Title Input */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">العنوان</FormLabel>
                  <FormControl>
                    <Input
                      className="form-input"
                      placeholder="مثال: الأب الغني الأب الفقير"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. Author Input */}
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">اسم المؤلف</FormLabel>
                  <FormControl>
                    <Input
                      className="form-input"
                      placeholder="مثال: روبرت كيوساكي"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5. Voice Selector */}
            <FormField
              control={form.control}
              name="persona"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">اختر صوت المساعد</FormLabel>
                  <FormControl>
                    <VoiceSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 6. Submit Button */}
            <Button type="submit" className="form-btn" disabled={isSubmitting}>
              ابدأ التجميع
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
};

export default UploadForm;
