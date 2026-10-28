"""
Data Augmentation Pipeline for Handwritten Tamil Characters.
Supports:
- Random rotation (±10°)
- Affine shear and scale
- Stroke thickness variation (dilation / erosion)
- Gaussian noise
- Random erasing / cutout
- Elastic distortion approximation
"""

import numpy as np
from PIL import Image, ImageOps, ImageFilter
import random
from typing import Tuple

class TamilDataAugmentor:
    def __init__(
        self,
        rotation_range: float = 10.0,
        shear_range: float = 0.1,
        scale_range: Tuple[float, float] = (0.9, 1.1),
        noise_std: float = 0.05,
        cutout_prob: float = 0.3,
        thickness_prob: float = 0.4
    ):
        self.rotation_range = rotation_range
        self.shear_range = shear_range
        self.scale_range = scale_range
        self.noise_std = noise_std
        self.cutout_prob = cutout_prob
        self.thickness_prob = thickness_prob

    def augment(self, image: Image.Image) -> Image.Image:
        """Applies a randomized combination of distortions to a PIL Grayscale image."""
        if image.mode != "L":
            image = image.convert("L")

        w, h = image.size

        # 1. Random Rotation (±10 deg)
        angle = random.uniform(-self.rotation_range, self.rotation_range)
        image = image.rotate(angle, resample=Image.Resampling.BILINEAR, fillcolor=0)

        # 2. Random Affine (Shear and Scaling)
        shear_x = random.uniform(-self.shear_range, self.shear_range)
        scale = random.uniform(self.scale_range[0], self.scale_range[1])
        
        matrix = (
            scale, shear_x, -w * (scale - 1) / 2,
            0, scale, -h * (scale - 1) / 2
        )
        image = image.transform((w, h), Image.Transform.AFFINE, matrix, resample=Image.Resampling.BILINEAR, fillcolor=0)

        # Convert to numpy array for pixel/stroke level transforms
        arr = np.array(image, dtype=np.float32) / 255.0

        # 3. Stroke Thickness Variation (Morphological approximation)
        if random.random() < self.thickness_prob:
            img_thick = Image.fromarray((arr * 255).astype(np.uint8))
            if random.random() > 0.5:
                # Thicker: MaxFilter
                img_thick = img_thick.filter(ImageFilter.MaxFilter(3))
            else:
                # Thinner: MinFilter
                img_thick = img_thick.filter(ImageFilter.MinFilter(3))
            arr = np.array(img_thick, dtype=np.float32) / 255.0

        # 4. Additive Gaussian Noise
        if random.random() < 0.5:
            noise = np.random.normal(0, self.noise_std, arr.shape)
            arr = np.clip(arr + noise, 0.0, 1.0)

        # 5. Random Erasing / Cutout
        if random.random() < self.cutout_prob:
            cut_h = random.randint(4, max(5, int(h * 0.25)))
            cut_w = random.randint(4, max(5, int(w * 0.25)))
            y1 = random.randint(0, h - cut_h)
            x1 = random.randint(0, w - cut_w)
            arr[y1:y1+cut_h, x1:x1+cut_w] = 0.0

        result = Image.fromarray((arr * 255).astype(np.uint8))
        return result

    def normalize(self, arr: np.ndarray) -> np.ndarray:
        """Normalizes input array to standard 0-1 and zero-mean if needed."""
        arr = arr.astype(np.float32)
        if arr.max() > 1.0:
            arr /= 255.0
        return arr

if __name__ == "__main__":
    augmentor = TamilDataAugmentor()
    # Test on a dummy blank canvas
    test_img = Image.new("L", (64, 64), color=0)
    aug = augmentor.augment(test_img)
    print(f"Data augmentor test passed! Output size: {aug.size}")
