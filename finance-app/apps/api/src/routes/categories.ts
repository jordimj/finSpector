import { pool } from '@finance/db';
import type { FastifyInstance } from 'fastify';

type CategoryRow = {
  id: number;
  name: string;
  subcategory_id: number | null;
  subcategory_name: string | null;
};

type CategoryResponse = {
  id: number;
  name: string;
  subcategories: Array<{
    id: number;
    name: string;
  }>;
};

export async function registerCategoryRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get('/', async () => {
    const result = await pool.query<CategoryRow>(`
      select
        categories.id,
        categories.name,
        subcategories.id as subcategory_id,
        subcategories.name as subcategory_name
      from categories
      left join subcategories on subcategories.category_id = categories.id
      order by categories.name, subcategories.name;
    `);

    return groupCategoryRows(result.rows);
  });
}

function groupCategoryRows(rows: CategoryRow[]): CategoryResponse[] {
  const categories = new Map<number, CategoryResponse>();

  for (const row of rows) {
    const category = categories.get(row.id) ?? {
      id: row.id,
      name: row.name,
      subcategories: [],
    };

    if (!categories.has(row.id)) {
      categories.set(row.id, category);
    }

    if (row.subcategory_id !== null && row.subcategory_name !== null) {
      category.subcategories.push({
        id: row.subcategory_id,
        name: row.subcategory_name,
      });
    }
  }

  return Array.from(categories.values());
}
