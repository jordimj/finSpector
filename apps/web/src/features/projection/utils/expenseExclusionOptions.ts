import type { Category } from '../../../hooks/useCategories';
import type { ProjectionExpenseExclusion } from '../hooks/useProjection';
import {
  createProjectionExpenseExclusionId,
  type ProjectionCustomExpenseExclusion,
} from '../hooks/useProjectionSettings';

type ExpenseExclusionOption = {
  exclusion: ProjectionCustomExpenseExclusion;
  label: string;
  value: string;
};

export function buildExpenseExclusionOptions(
  categories: Category[],
  exclusions: ProjectionExpenseExclusion[],
): ExpenseExclusionOption[] {
  const existingTargets = new Set(
    exclusions.flatMap((exclusion) =>
      exclusion.targetId === null
        ? []
        : [`${exclusion.targetType}:${exclusion.targetId}`],
    ),
  );

  return categories.flatMap((category) => {
    const categoryOption = toExpenseExclusionOption(category);
    const subcategoryOptions = category.subcategories.map((subcategory) =>
      toExpenseExclusionOption(category, subcategory),
    );

    return [categoryOption, ...subcategoryOptions].filter(
      (option) => !existingTargets.has(option.value),
    );
  });
}

function toExpenseExclusionOption(
  category: Category,
  subcategory?: Category['subcategories'][number],
): ExpenseExclusionOption {
  const id = createProjectionExpenseExclusionId(category.id, subcategory?.id);

  return {
    exclusion: {
      categoryId: category.id,
      categoryName: category.name,
      id,
      ...(subcategory === undefined
        ? {}
        : {
            subcategoryId: subcategory.id,
            subcategoryName: subcategory.name,
          }),
    },
    label:
      subcategory === undefined
        ? category.name
        : `${category.name} / ${subcategory.name}`,
    value:
      subcategory === undefined
        ? `category:${category.id}`
        : `subcategory:${subcategory.id}`,
  };
}
