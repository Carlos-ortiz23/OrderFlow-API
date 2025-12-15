-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 2. TABLAS DE CATÁLOGO (Lookup Tables)
-- Reemplazan a los Enums para máxima escalabilidad
-- --------------------------------------------------------

-- Catálogo: Estados de la Orden
CREATE TABLE order_statuses (
    id SERIAL PRIMARY KEY, -- ID numérico ligero (1, 2, 3...)
    code VARCHAR(50) UNIQUE NOT NULL, -- 'pending', 'paid' (Para usar en tu código Node.js)
    label VARCHAR(100) NOT NULL, -- 'Pendiente', 'Pagado' (Para mostrar en el Frontend)
    description TEXT
);

-- Catálogo: Métodos de Pago
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'nequi', 'cash'
    label VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Catálogo: Roles de Chat (IA)
CREATE TABLE chat_roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL -- 'system', 'user', 'assistant'
);

-- --------------------------------------------------------
-- 3. INSERCIÓN DE DATOS INICIALES (SEED DATA)
-- Ejecutamos esto YA para que las tablas no estén vacías
-- --------------------------------------------------------

INSERT INTO order_statuses (code, label) VALUES 
('pending', 'Pendiente'),
('confirmed', 'Confirmado'),
('paid', 'Pagado'),
('shipped', 'Enviado'),
('cancelled', 'Cancelado'),
('completed', 'Completado');

INSERT INTO payment_methods (code, label) VALUES 
('cash', 'Efectivo'),
('transfer', 'Transferencia Bancaria'),
('nequi', 'Nequi'),
('daviplata', 'Daviplata'),
('card', 'Tarjeta de Crédito/Débito');

INSERT INTO chat_roles (code) VALUES 
('system'),
('user'), 
('assistant');

-- --------------------------------------------------------
-- 4. TABLAS PRINCIPALES (Core)
-- --------------------------------------------------------

-- Tabla: Tiendas
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    telegram_bot_token TEXT,
    system_prompt TEXT, -- Personalidad del bot
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Usuarios Admin
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin', -- Podrías hacer tabla de roles también si quisieras
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Productos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Clientes (Telegram)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    telegram_id BIGINT NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, telegram_id)
);

-- --------------------------------------------------------
-- 5. TABLAS TRANSACCIONALES (Con FKs a los catálogos)
-- --------------------------------------------------------

-- Tabla: Órdenes
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) NOT NULL,
    client_id UUID REFERENCES clients(id) NOT NULL,
    
    -- AQUÍ EL CAMBIO: Referencias a las tablas nuevas
    status_id INT REFERENCES order_statuses(id) DEFAULT 1, -- Por defecto 'pending' (ID 1)
    payment_method_id INT REFERENCES payment_methods(id),
    
    total_amount NUMERIC(10, 2) DEFAULT 0,
    shipping_address TEXT,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Detalles de Orden
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    product_name_snapshot VARCHAR(255),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    
    subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED 
);

-- --------------------------------------------------------
-- 6. TABLAS IA (Con FK a catálogos)
-- --------------------------------------------------------

-- Tabla: Historial de Mensajes
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    
    -- AQUÍ EL CAMBIO: Referencia a chat_roles
    role_id INT REFERENCES chat_roles(id) NOT NULL, 
    
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------
-- 7. ÍNDICES DE RENDIMIENTO
-- --------------------------------------------------------
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_clients_telegram ON clients(telegram_id);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_messages_client ON messages(client_id);
CREATE INDEX idx_orders_status ON orders(status_id); -- Útil para filtrar "Dame todos los pedidos pendientes"