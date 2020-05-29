import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
  getCartTotalQuantity(): number;
  getCartTotalValue(): number;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@marketCart:products',
      );
      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const updateProducts = useCallback(async (newProducts: Product[]) => {
    setProducts(newProducts);
    await AsyncStorage.setItem(
      '@marketCart:products',
      JSON.stringify(newProducts),
    );
  }, []);

  const getCartTotalQuantity = useCallback(() => {
    const total = products.reduce(
      (acummulator, { quantity }) => acummulator + quantity,
      0,
    );
    return total;
  }, [products]);
  const getCartTotalValue = useCallback(() => {
    const total = products.reduce(
      (acummulator, { quantity, price }) => acummulator + quantity * price,
      0,
    );
    return total;
  }, [products]);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );
      await updateProducts(newProducts);
    },
    [products, updateProducts],
  );

  const decrement = useCallback(
    async id => {
      let newProducts = products.map(product => {
        if (id === product.id) {
          return { ...product, quantity: product.quantity - 1 };
        }
        return product;
      });
      newProducts = newProducts.filter(({ quantity }) => !!quantity);
      await updateProducts(newProducts);
    },
    [products, updateProducts],
  );

  const addToCart = useCallback(
    async product => {
      const productCart = products.find(({ id }) => product.id === id);
      if (!productCart) {
        const newProducts = [...products, { ...product, quantity: 1 }];
        await updateProducts(newProducts);
      } else {
        const newProducts = products.map(cartProduct =>
          product.id === cartProduct.id
            ? { ...product, quantity: cartProduct.quantity + 1 }
            : cartProduct,
        );
        await updateProducts(newProducts);
      }
    },
    [products, updateProducts],
  );

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      getCartTotalQuantity,
      getCartTotalValue,
      products,
    }),
    [
      products,
      addToCart,
      increment,
      decrement,
      getCartTotalQuantity,
      getCartTotalValue,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
