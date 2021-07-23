import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  /*Não está passando o teste de adicionar produtos */
  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const productExists = newCart.find(product => product.id === productId);

      const amountInStock = await api.get(`/stock/${productId}`)
        .then(response => response.data.amount);

      const currentAmount = productExists ? productExists.amount : 0;

      if (amountInStock <= currentAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = currentAmount + 1;
      } else {
        const product = await api.get(`/products/${productId}`)
          .then(response => response.data);

        const newProduct = {
          ...product,
          amount: 1
        }

        newCart.push(newProduct);
      }

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const currentCart = [...cart];

      const removedProduct = cart.find(product => product.id === productId);

      if (removedProduct) {
        const newCart = currentCart.filter(product => product.id !== productId);

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  /*Não está passando o teste de atualizar a quantidade do produto */
  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const productInStock = await api.get(`/stock/${productId}`);
      const amountInStock = productInStock.data.amount;

      if (amount > amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map(product => {
        if (product.id === productId) {
          product.amount += 1;
        }
        return product;
      })

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
