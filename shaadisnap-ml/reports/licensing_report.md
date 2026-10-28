# Commercial Licensing & Pretrained Model Evaluation Report
**Project:** ShaadiSnap AI — Privacy-First Wedding Photo Discovery Platform  
**Target:** Commercial Production Deployment & GPU Fine-Tuning  
**Date:** October 2026  
**Author:** AI/ML Engineering & Production Security Team  

---

## 1. Executive Summary

ShaadiSnap AI is a commercial SaaS platform enabling wedding couples and authorized guests to discover photos containing specific identities. Because biometric processing is subject to rigorous regulatory compliance (e.g., EU GDPR Articles 9/35, India DPDP Act 2023, Illinois BIPA) and commercial software licensing standards, model selection requires scrutinizing three distinct layers:
1. **Source Code License** (the training framework and loss function implementations).
2. **Pretrained Weights License** (the license attached to model checkpoints).
3. **Training Dataset Provenance** (the original dataset terms on which weights were trained).

Many widely referenced "open-source" face recognition models (notably standard InsightFace checkpoints trained on MS1M or Glint360k) carry strict **Non-Commercial Research-Only** clauses or depend on legally encumbered datasets (such as MS-Celeb-1M, which was officially withdrawn by Microsoft). Deploying or fine-tuning those checkpoints inside a commercial product creates immediate legal and copyright liabilities.

Following this investigation, **we select the AuraFace-v1 architecture (IResNet-100 / ResNet-100 with ArcFace Margin Loss) under Apache License 2.0**, paired with an **in-house PyTorch ArcFace fine-tuning framework** capable of ingesting either:
- The converted Apache 2.0 AuraFace weights for domain adaptation, or
- Permissively licensed foundational backbones (e.g., ImageNet Apache 2.0 / MIT ResNet backbones) trained with our native ArcFace head.

---

## 2. Comparative Model & Checkpoint Analysis

| Model Architecture | Source Code License | Pretrained Weights License | Dataset Provenance | Commercial Viability | Training Compatibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **InsightFace (buffalo_l / glint360k)** | MIT | **Non-Commercial / Research Only** | MS1M-RetinaFace / Glint360k (Non-commercial, scraped faces) | ❌ **Strictly Prohibited** | PyTorch & ONNX available |
| **AuraFace-v1 (fal.ai)** | Apache 2.0 | **Apache 2.0 (Commercial OK)** | Curated commercial & public domain faces with commercial rights | ✅ **Authorized for Commercial SaaS** | Shipped as ONNX; weights extractable into native PyTorch `iresnet100` |
| **FaceNet-PyTorch (InceptionResnetV1)** | MIT | Restricted by Dataset | VGGFace2 / CASIA-WebFace (Non-commercial research agreements) | ⚠️ **High Legal Risk** (Dataset license violation) | PyTorch native |
| **AdaFace (Columbia)** | MIT | **Non-Commercial** | WebFace4M / WebFace12M (Requires academic research agreement) | ❌ **Prohibited for Commercial** | PyTorch native |
| **Custom IResNet / ResNet-50 + ArcFace Head** | Apache 2.0 (Native) | Apache 2.0 / MIT (Converted AuraFace or ImageNet-1K) | Proprietary consenting wedding dataset | ✅ **100% Legally Clean & Reproducible** | Fully native PyTorch training & export |

---

## 3. Deep Dive into Evaluated Candidates

### 3.1. InsightFace & Glint360k / MS1MV2 (Why It Cannot Be Used)
- **Code:** DeepInsight maintains the `insightface` repository under MIT.
- **Weights & Datasets:** Model zoos provided in the standard `insightface` library (such as `antelopev2`, `buffalo_l`, and weights pretrained on Glint360k or MS1M-ArcFace) are explicitly governed by non-commercial research licenses.
- **Dataset Controversy:** MS-Celeb-1M was taken down by Microsoft in 2019 due to privacy and consent violations. Derivatives (MS1M-ArcFace, MS1MV2, MS1MV3) remain tainted for commercial deployments.
- **Verdict for ShaadiSnap AI:** **REJECTED.** Using standard InsightFace model zoo weights in ShaadiSnap AI would expose the company to intellectual property infringement and regulatory enforcement.

### 3.2. AuraFace-v1 by fal.ai (Primary Candidate)
- **Repository:** Hugging Face `fal/AuraFace-v1`
- **Code & Weights License:** **Apache License 2.0** (both repository metadata and model card explicitly state commercial usability).
- **Dataset Provenance:** fal.ai specifically trained AuraFace-v1 using ethically collected, commercially cleared, and publicly permitted imagery to create a drop-in, legally compliant alternative to research-locked models.
- **Architecture:** IResNet-100 backbone outputting 512-dimensional L2-normalized embeddings, trained using Additive Angular Margin Loss (ArcFace).
- **Artifacts Provided:** Hugging Face repository provides `glintr100.onnx`, `scrfd_10g_bnkps.onnx`, `2d106det.onnx`, `genderage.onnx`.
- **Training Consideration:** The release provides production-optimized ONNX models. Standard PyTorch training code cannot fine-tune an ONNX file directly without loading its graph or translating its weight tensors into a native PyTorch `nn.Module` (IResNet-100).
- **Verdict for ShaadiSnap AI:** **ACCEPTED.** We provide a dual-path pipeline:
  1. For fast production zero-shot inference/indexing, use AuraFace ONNX directly.
  2. For domain-specific fine-tuning (Indian weddings, jewelry, turbans, heavy makeup, variable stage lighting), we load the native PyTorch IResNet backbone with AuraFace-converted weights or train our native ArcFace module on consented wedding datasets.

### 3.3. Permissively Initialized Backbone (Fallback & Clean-Room Baseline)
- **Architecture:** IResNet-50 / IResNet-100 or ResNet-50 with ArcFace Margin Loss head.
- **Initialization:** ImageNet-1K weights (Apache 2.0 / BSD) or clean random initialization.
- **Loss Function:** Additive Angular Margin Loss ($s=64.0, m=0.50$) with CosFace margin option ($m=0.35$).
- **Verdict:** **ACCEPTED** as an auxiliary fully-reproducible clean-room training baseline that guarantees zero external dependency or dataset contamination.

---

## 4. Final Architectural Decision

1. **Backbone Architecture:** Deep Residual Face Network (`IResNet100` / `IResNet50`) with 512-dimensional output embedding and L2 spherical normalization.
2. **Detection & Alignment:** 5-point facial landmark alignment (eyes, nose, mouth corners) warped to the canonical 112×112 standard face coordinate frame.
3. **Training Objective:** ArcFace Loss ($\mathcal{L}_{\text{ArcFace}}$) with mixed-precision FP16 stability, dynamic margin scaling, and cosine learning rate decay.
4. **Licensing Status:** 100% Apache 2.0 compliant across code, weights, and deployment runtime.
