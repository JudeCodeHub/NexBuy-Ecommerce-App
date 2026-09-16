'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import WishlistButton from "./WishlistButton";
import MessageSellerButton from "./MessageSellerButton";

const trustPoints = [
    { icon: EarthIcon, label: "Free shipping worldwide" },
    { icon: CreditCardIcon, label: "100% Secured Payment" },
    { icon: UserIcon, label: "Trusted by top brands" },
];

const ProductDetails = ({ product }) => {

    const productId = product.id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();

    const router = useRouter()

    const [mainImage, setMainImage] = useState(product.images[0]);

    const addToCartHandler = () => {
        dispatch(addToCart({ productId }))
    }

    const averageRating = product?.rating?.length
        ? product.rating.reduce((acc, item) => acc + item.rating, 0) / product.rating.length
        : 0;

    const discountPercent = product.mrp > product.price
        ? Math.round((product.mrp - product.price) / product.mrp * 100)
        : 0;

    return (
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

            {/* Image column */}
            <div className="lg:w-[55%] flex flex-col items-center gap-4">
                <div className="relative w-full max-w-[500px] aspect-square bg-surface-light rounded-2xl shadow-lg shadow-black/30 p-4 flex items-center justify-center overflow-hidden">
                    <Image src={mainImage} alt={product.name} width={470} height={470} className="w-full h-full object-contain scale-[2.2] -ml-10" />
                </div>

                {product.images.length > 1 && (
                    <div className="flex gap-3">
                        {product.images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setMainImage(image)}
                                className={`size-10 shrink-0 rounded-lg bg-surface-light flex items-center justify-center overflow-hidden transition ${mainImage === image ? 'ring-2 ring-accent' : 'ring-1 ring-slate-700 hover:ring-slate-500'}`}
                            >
                                <Image src={image} alt="" width={60} height={60} className="w-full h-full object-contain scale-[1]" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Details column */}
            <div className="flex-1 flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl lg:text-[32px] font-bold text-white leading-tight">{product.name}</h1>
                    <div className='flex items-center gap-2 mt-3'>
                        <div className="flex">
                            {Array(5).fill('').map((_, index) => (
                                <StarIcon key={index} size={16} className='text-transparent' fill={averageRating >= index + 1 ? "#00C950" : "#14532D"} />
                            ))}
                        </div>
                        <p className="text-sm text-muted">{product.rating.length} Reviews</p>
                    </div>
                </div>

                <div className="flex items-end gap-3">
                    <p className="text-3xl font-bold text-accent">{currency}{product.price}</p>
                    {product.mrp > product.price && (
                        <p className="text-base text-muted line-through mb-0.5">{currency}{product.mrp}</p>
                    )}
                </div>

                {discountPercent > 0 && (
                    <div className="inline-flex items-center gap-1.5 w-fit bg-accent/15 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
                        <TagIcon size={14} />
                        Save {discountPercent}% right now
                    </div>
                )}

                <div className="flex items-end gap-4 mt-2">
                    {
                        cart[productId] && (
                            <div className="flex flex-col gap-2">
                                <p className="text-sm text-muted font-medium">Quantity</p>
                                <Counter productId={productId} />
                            </div>
                        )
                    }
                    <button
                        onClick={() => !cart[productId] ? addToCartHandler() : router.push('/cart')}
                        className="flex-1 lg:flex-none h-[52px] flex items-center justify-center bg-accent hover:bg-accent-hover text-slate-900 font-bold px-10 rounded-lg shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98] transition-all"
                    >
                        {!cart[productId] ? 'Add to Cart' : 'View Cart'}
                    </button>
                    <WishlistButton
                        product={product}
                        variant="labeled"
                        size={18}
                        className="shrink-0 flex items-center justify-center gap-2 h-[52px] px-6 rounded-lg border border-white/10 bg-panel hover:border-accent/60 text-sm font-semibold text-slate-200 transition-colors"
                    />
                    <MessageSellerButton productId={productId} />
                </div>

                <hr className="border-white/10 mt-2" />

                <div className="flex flex-col gap-4">
                    {trustPoints.map(({ icon: Icon, label }, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm text-muted hover:text-slate-200 transition-colors w-fit">
                            <Icon size={20} className="shrink-0" />
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ProductDetails
