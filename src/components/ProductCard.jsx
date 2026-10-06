import { useState } from "react";
import "./ProductCard.css";
import defaultProductImage from "../assets/images/default-product.png";

function ProductCard({ imageUrl, name, price, favoriteCount }) {
  const [hasImageError, setHasImageError] = useState(false);

  const shouldShowImage = imageUrl && !hasImageError;

  return (
    <article className="product-card">
      {shouldShowImage ? (
        <img
          className="product-card-image"
          src={imageUrl}
          alt={name}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <img
              className="product-card-image"
              src={defaultProductImage}
              alt={`${name} 기본 이미지`}
         />
      )}

      <h3 className="product-card-name">{name}</h3>
      <p className="product-card-price">{price.toLocaleString()}원</p>
      <p className="product-card-favorite">♡ {favoriteCount}</p>
    </article>
  );
}

export default ProductCard;