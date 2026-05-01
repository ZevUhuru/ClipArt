-- Fix an incorrectly seeded pack slug/category.
-- The pack title/tags/artwork are Christmas-themed, but the generated slug
-- previously referenced Mother's Day and no pack category was assigned.
update packs
set
  slug = 'kawaii-christmas',
  category_id = (
    select id
    from categories
    where type = 'pack'
      and slug = 'holidays'
    limit 1
  )
where id = '723d9fa8-4b28-457a-967e-ef758cd241c1';
