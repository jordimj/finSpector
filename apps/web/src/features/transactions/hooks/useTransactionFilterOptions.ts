import { useMemo } from 'react';
import type { Category } from '../../../hooks/useCategories';
import type {
  CategoryFilterOption,
  SubcategoryFilterOption,
} from '../utils/transactionFilters';

export function useTransactionFilterOptions({
  categories,
  selectedCategoryId,
}: {
  categories: Category[];
  selectedCategoryId: number | undefined;
}) {
  const categoryOptions = useMemo<CategoryFilterOption[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        label: category.name,
        value: String(category.id),
      })),
    [categories],
  );
  const subcategoryOptions = useMemo<SubcategoryFilterOption[]>(() => {
    const sourceCategories =
      selectedCategoryId === undefined
        ? categories
        : categories.filter((category) => category.id === selectedCategoryId);

    return sourceCategories.flatMap((category) =>
      category.subcategories.map((subcategory) => ({
        categoryId: category.id,
        detail: category.name,
        id: subcategory.id,
        label: subcategory.name,
        value: String(subcategory.id),
      })),
    );
  }, [categories, selectedCategoryId]);

  return {
    categoryOptions,
    subcategoryOptions,
  };
}
