import { adminListCategories, deleteCategory, saveCategory } from '@/services/admin';
import { TaxonomyManager } from '@/components/admin/TaxonomyManager';
import { AdminPageHeader } from './AdminLayout';

export default function AdminCategories() {
  return (
    <>
      <AdminPageHeader title="Categories" description="Collections shown in navigation, filters and the home page grid." />
      <TaxonomyManager
        singular="Category"
        ordered
        imageLabel="Image URL"
        load={adminListCategories}
        save={(r, id) =>
          saveCategory(
            {
              slug: r.slug,
              name: r.name,
              description: r.description,
              imageUrl: r.imageUrl,
              position: r.position ?? 0,
              isActive: r.isActive ?? true,
            },
            id,
          )
        }
        remove={deleteCategory}
      />
    </>
  );
}
