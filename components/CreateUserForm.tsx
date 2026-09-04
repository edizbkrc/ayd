"use client";

import CustomSelect from "./CustomSelect";

export default function CreateUserForm({
  action,
  roles,
  defaultRoleId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  roles: { id: string; name: string }[];
  defaultRoleId: string;
}) {
  return (
    <form action={action} className="grid sm:grid-cols-2 gap-3">
      <div>
        <label className="label" htmlFor="name">Ad soyad</label>
        <input className="input" id="name" name="name" required autoFocus placeholder="Ayşe Yılmaz" />
      </div>
      <div>
        <label className="label" htmlFor="email">E-posta</label>
        <input className="input" id="email" name="email" type="email" required placeholder="ayse@sirket.com" />
      </div>
      <div>
        <label className="label" htmlFor="password">Şifre</label>
        <input className="input" id="password" name="password" type="password" minLength={6} required />
      </div>
      <div>
        <label className="label">Rol</label>
        <CustomSelect
          name="roleId"
          defaultValue={defaultRoleId}
          options={roles.map((r) => ({ value: r.id, label: r.name }))}
        />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn">Kullanıcıyı oluştur</button>
      </div>
    </form>
  );
}
