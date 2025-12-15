-- Run this in your Supabase SQL Editor to fix the "function not found" error.

create or replace function reduce_product_stock(product_id uuid, quantity_to_reduce int)
returns void
language plpgsql
as $$
declare
  current_stock int;
begin
  -- Lock the row for update to prevent race conditions
  select stock_quantity into current_stock
  from products
  where id = product_id
  for update;

  if not found then
    raise exception 'Product not found';
  end if;

  if current_stock < quantity_to_reduce then
    raise exception 'Insufficient stock';
  end if;

  update products
  set stock_quantity = stock_quantity - quantity_to_reduce
  where id = product_id;
end;
$$;
