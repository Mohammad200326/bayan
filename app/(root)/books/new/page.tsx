import UploadForm from "@/components/UploadForm";

const Page = () => {
  return (
    <main className="wrapper container">
      <div className="mx-auto max-w-180 space-y-10">
        <section className="flex flex-col gap-5">
          <h1 className="page-title-xl">أضف كتابًا جديدًا</h1>
          <p className="subtitle">قم بتحميل ملف PDF لإنشاء مقابلة تفاعلية</p>
        </section>

        <UploadForm />
      </div>
    </main>
  );
};

export default Page;
