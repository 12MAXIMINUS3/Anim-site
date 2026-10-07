import { adminListCategories, deleteCategory, saveCategory } from '@/services/admin';
import { TaxonomyManager } from '@/components/admin/TaxonomyManager';
import { AdminPageHeader } from './AdminLayout';
import { placeholderCategoryPath } from '@/data/seedProducts';

export default function AdminCategories() {
  return (
    <>
      <AdminPageHeader title="Categories" description="Collections shown in navigation, filters and the home page grid." />
      <TaxonomyManager
        singular="Category"
        ordered
        imageLabel="Category image"
        uploadFolder="categories"
        load={adminListCategories}
        save={(r, id) =>
          saveCategory(
            {
              slug: r.slug,
              name: r.name,
              description: r.description,
              // No image → fall back to the built-in tile instead of an empty box.
              imageUrl: r.imageUrl || placeholderCategoryPath(r.slug),
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
