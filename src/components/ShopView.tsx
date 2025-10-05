import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ShoppingBag, Edit, Trash2, DollarSign, Package, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  user_id: string;
}

export const ShopView: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [userCoins, setUserCoins] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: ''
  });

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchUserCoins();
    }
  }, [user]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('shop_products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(data || []);
  };

  const fetchUserCoins = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setUserCoins(Number(data.balance));
    } else if (error && error.code === 'PGRST116') {
      // Create coin record if it doesn't exist
      const { data: newCoins } = await supabase
        .from('user_coins')
        .insert({ user_id: user.id, balance: 100 })
        .select()
        .single();
      
      if (newCoins) {
        setUserCoins(Number(newCoins.balance));
      }
    }
  };

  const handleAddProduct = async () => {
    if (!user || !newProduct.name || !newProduct.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase
      .from('shop_products')
      .insert({
        user_id: user.id,
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock) || 0,
        image_url: newProduct.image_url || null,
        is_active: true
      });

    if (error) {
      toast.error("Failed to add product");
      console.error(error);
      return;
    }

    toast.success("Product added successfully!");
    setIsAddDialogOpen(false);
    setNewProduct({ name: '', description: '', price: '', stock: '', image_url: '' });
    fetchProducts();
  };

  const handlePurchase = async (product: Product) => {
    if (!user) {
      toast.error("Please login to purchase");
      return;
    }

    if (userCoins < product.price) {
      toast.error("Insufficient coins");
      return;
    }

    // Get current buyer coins data
    const { data: buyerCoins } = await supabase
      .from('user_coins')
      .select('total_spent')
      .eq('user_id', user.id)
      .single();

    // Deduct coins from buyer
    const { error: coinsError } = await supabase
      .from('user_coins')
      .update({ 
        balance: userCoins - product.price,
        total_spent: (buyerCoins?.total_spent || 0) + product.price
      })
      .eq('user_id', user.id);

    if (coinsError) {
      toast.error("Purchase failed");
      return;
    }

    // Get current seller coins data
    const { data: sellerCoins } = await supabase
      .from('user_coins')
      .select('balance, total_earned')
      .eq('user_id', product.user_id)
      .single();

    // Add coins to seller
    if (sellerCoins) {
      const { error: sellerError } = await supabase
        .from('user_coins')
        .update({ 
          balance: (sellerCoins.balance || 0) + product.price,
          total_earned: (sellerCoins.total_earned || 0) + product.price
        })
        .eq('user_id', product.user_id);
    }

    toast.success("Purchase successful! 🎉");
    fetchUserCoins();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Shop</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Coins className="w-4 h-4 mr-2" />
                {formatNumber(userCoins)} Coins
              </Badge>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Enter product name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="Describe your product"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (Coins) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="stock">Stock</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        value={newProduct.image_url}
                        onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddProduct}>
                      Add Product
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to add products to the shop!
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  {product.stock <= 0 && (
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 text-lg font-bold">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      {formatNumber(product.price)}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(product)}
                      disabled={product.stock <= 0 || product.user_id === user?.id}
                    >
                      {product.user_id === user?.id ? "Your Product" : "Buy Now"}
                    </Button>
                  </div>
                  
                  {product.stock > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {product.stock} in stock
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};