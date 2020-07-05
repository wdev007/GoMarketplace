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
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const findProductInCart = products.find(prod => prod.id === product.id);
      if (findProductInCart) {
        const productsWithNewQuantity = products.map(prod => {
          if (prod.id === product.id) {
            // eslint-disable-next-line no-param-reassign
            prod.quantity += 1;
          }
          return prod;
        });
        setProducts(productsWithNewQuantity);
        return;
      }
      setProducts(productsPrev => [
        ...productsPrev,
        { ...product, quantity: 1 },
      ]);
      AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const findProduct = products.find(prod => prod.id === id);

      if (!findProduct) {
        return false;
      }
      setProducts(prevProducts =>
        prevProducts.map(prod => {
          if (prod.id === id) {
            // eslint-disable-next-line no-param-reassign
            prod.quantity += 1;
          }
          return prod;
        }),
      );
      AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
      return true;
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const findProduct = products.find(
        prod => prod.id === id && prod.quantity > 1,
      );

      const productsWithQuantity = products.map(prod => {
        if (prod.id === id) {
          // eslint-disable-next-line no-param-reassign
          prod.quantity -= 1;
        }
        return prod;
      });

      if (!findProduct) {
        setProducts(prevProducts =>
          prevProducts.filter(prod => prod.id !== id),
        );
        AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
        return false;
      }

      setProducts(productsWithQuantity);

      return true;
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
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
