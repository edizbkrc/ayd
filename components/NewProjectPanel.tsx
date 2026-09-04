import { PlusIcon } from "./icons";

export default function NewProjectPanel({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="card-surface p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <PlusIcon className="h-4 w-4" />
          </span>
          Yeni proje
        </h2>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          İşler bir projenin içinde durur. Aşamalar otomatik gelir: Yapılacak, Devam ediyor, Bitti.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="name">
          Proje adı
        </label>
        <input className="input" id="name" name="name" required autoFocus placeholder="ör. Pazarlama" />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Açıklama
        </label>
        <input className="input" id="description" name="description" placeholder="Kısa açıklama (opsiyonel)" />
      </div>
      <button type="submit" className="btn">
        Projeyi oluştur
      </button>
    </form>
  );
}
