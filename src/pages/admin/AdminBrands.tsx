import { adminListBrands, deleteBrand, saveBrand } from '@/services/admin';
import { TaxonomyManager } from '@/components/admin/TaxonomyManager';
import { AdminPageHeader } from './AdminLayout';

export default function AdminBrands() {
  return (
    <>
      <AdminPageHeader title="Brands" description="Manufacturers and studios used for product attribution and filtering." />
      <TaxonomyManager
        singular="Brand"
        imageLabel="Brand logo"
        uploadFolder="brands"
        load={async () => (await adminListBrands()).map((b) => ({ ...b, imageUrl: b.logoUrl }))}
        save={(r, id) => saveBrand({ slug: r.slug, name: r.name, description: r.description, logoUrl: r.imageUrl }, id)}
        remove={deleteBrand}
      />
    </>
  );
}
