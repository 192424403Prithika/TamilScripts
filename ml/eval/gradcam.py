"""
Grad-CAM (Gradient-Weighted Class Activation Mapping) Visualizer for TamilScript AI.
Provides neural explainability by visualizing which strokes and loops of a drawn Tamil glyph
activated the model's top prediction.
"""

import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image

class GradCAMExplainer:
    def __init__(self, model, target_layer=None):
        self.model = model
        self.model.eval()
        self.target_layer = target_layer or self.model.stage3[0].conv2.pointwise
        self.gradients = None
        self.activations = None
        
        # Register hooks
        self.hook_fwd = self.target_layer.register_forward_hook(self._save_activations)
        self.hook_bwd = self.target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def generate_heatmap(self, input_tensor: torch.Tensor, class_idx: int = None) -> np.ndarray:
        """
        input_tensor: (1, 1, 64, 64)
        Returns: (64, 64) float32 heatmap normalized to [0.0, 1.0]
        """
        self.model.zero_grad()
        logits = self.model(input_tensor)

        if class_idx is None:
            class_idx = int(torch.argmax(logits, dim=-1).item())

        score = logits[0, class_idx]
        score.backward(retain_graph=True)

        gradients = self.gradients.data[0] # (C, H, W)
        activations = self.activations.data[0] # (C, H, W)

        # Global average pool gradients along spatial dimensions to obtain importance weights alpha_k
        weights = torch.mean(gradients, dim=(1, 2), keepdim=True) # (C, 1, 1)

        # Weighted combination of activation maps followed by ReLU
        cam = torch.sum(weights * activations, dim=0) # (H, W)
        cam = F.relu(cam)

        cam_np = cam.cpu().numpy()
        # Resize to input canvas size (64, 64)
        if cam_np.max() > 0:
            cam_np = (cam_np - cam_np.min()) / (cam_np.max() - cam_np.min() + 1e-8)
        else:
            cam_np = np.zeros_like(cam_np)

        cam_img = Image.fromarray((cam_np * 255).astype(np.uint8)).resize((64, 64), Image.Resampling.BILINEAR)
        return np.array(cam_img, dtype=np.float32) / 255.0

    def cleanup(self):
        self.hook_fwd.remove()
        self.hook_bwd.remove()
