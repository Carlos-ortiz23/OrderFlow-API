-- 5.0 Product Tags and Categories
-- This script adds support for product categories and tags

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, name)
);

-- Add index for faster queries by store_id
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, name)
);

-- Add index for faster queries by store_id
CREATE INDEX IF NOT EXISTS idx_tags_store_id ON tags(store_id);

-- Create product_categories junction table
CREATE TABLE IF NOT EXISTS product_categories (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (product_id, category_id)
);

-- Create product_tags junction table
CREATE TABLE IF NOT EXISTS product_tags (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (product_id, tag_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id ON product_tags(tag_id);

-- Function to get products by category
CREATE OR REPLACE FUNCTION get_products_by_category(p_store_id UUID, p_category_name VARCHAR)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    product_description TEXT,
    product_price DECIMAL,
    product_stock_quantity INTEGER,
    product_is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        p.price AS product_price,
        p.stock_quantity AS product_stock_quantity,
        p.is_active AS product_is_active
    FROM products p
    JOIN product_categories pc ON p.id = pc.product_id
    JOIN categories c ON pc.category_id = c.id
    WHERE p.store_id = p_store_id
    AND c.name ILIKE p_category_name
    AND p.is_active = TRUE
    AND c.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get products by tag
CREATE OR REPLACE FUNCTION get_products_by_tag(p_store_id UUID, p_tag_name VARCHAR)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    product_description TEXT,
    product_price DECIMAL,
    product_stock_quantity INTEGER,
    product_is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        p.price AS product_price,
        p.stock_quantity AS product_stock_quantity,
        p.is_active AS product_is_active
    FROM products p
    JOIN product_tags pt ON p.id = pt.product_id
    JOIN tags t ON pt.tag_id = t.id
    WHERE p.store_id = p_store_id
    AND t.name ILIKE p_tag_name
    AND p.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get all categories for a store
CREATE OR REPLACE FUNCTION get_store_categories(p_store_id UUID)
RETURNS TABLE (
    category_id UUID,
    category_name VARCHAR,
    category_description TEXT,
    product_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS category_id,
        c.name AS category_name,
        c.description AS category_description,
        COUNT(pc.product_id) AS product_count
    FROM categories c
    LEFT JOIN product_categories pc ON c.id = pc.category_id
    LEFT JOIN products p ON pc.product_id = p.id AND p.is_active = TRUE
    WHERE c.store_id = p_store_id
    AND c.is_active = TRUE
    GROUP BY c.id, c.name, c.description
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get all tags for a store
CREATE OR REPLACE FUNCTION get_store_tags(p_store_id UUID)
RETURNS TABLE (
    tag_id UUID,
    tag_name VARCHAR,
    product_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS tag_id,
        t.name AS tag_name,
        COUNT(pt.product_id) AS product_count
    FROM tags t
    LEFT JOIN product_tags pt ON t.id = pt.tag_id
    LEFT JOIN products p ON pt.product_id = p.id AND p.is_active = TRUE
    WHERE t.store_id = p_store_id
    GROUP BY t.id, t.name
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get all tags for a product
CREATE OR REPLACE FUNCTION get_product_tags(p_product_id UUID)
RETURNS TABLE (
    tag_id UUID,
    tag_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS tag_id,
        t.name AS tag_name
    FROM tags t
    JOIN product_tags pt ON t.id = pt.tag_id
    WHERE pt.product_id = p_product_id
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get all categories for a product
CREATE OR REPLACE FUNCTION get_product_categories(p_product_id UUID)
RETURNS TABLE (
    category_id UUID,
    category_name VARCHAR,
    category_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS category_id,
        c.name AS category_name,
        c.description AS category_description
    FROM categories c
    JOIN product_categories pc ON c.id = pc.category_id
    WHERE pc.product_id = p_product_id
    AND c.is_active = TRUE
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;
