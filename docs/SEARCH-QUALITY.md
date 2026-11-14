# VisuFind search quality: what the implementation can and cannot do

## What changed in this version

1. The browser prepares an upload under the Vercel request-body ceiling while trying higher-quality JPEG settings before reducing image dimensions.
2. The server validates the actual image contents with Sharp and progressively reduces dimensions/quality to meet the provider's 500 KB image-upload ceiling.
3. The Google Lens response is kept in two separate groups:
   - `exact_matches` → `provider_exact`
   - `visual_matches` → `visual`
4. Duplicate source-page URLs are collapsed after removing URL fragments and common analytics parameters.
5. The results UI lets users inspect the two groups separately and explains that the labels come from Google Lens.

## Why this does not add CLIP or face recognition

An embedding model can compare a query image with candidate images. It does not search the public web by itself. VisuFind would still need a lawful, searchable candidate-image corpus or a search provider that returns candidate image URLs. Running CLIP against a few Google Lens thumbnails may produce a visual similarity score, but it cannot prove that two photographs show the same person. It can also rank the same clothes, scene, pose, or colors highly.

For that reason this version does not add a large model download, a new paid API, or misleading "same person" confidence scores. It preserves the available provider signal and makes its limits visible.

## No-new-spend rule

- No new paid API or subscription is introduced by this update.
- SerpApi remains the existing web-search provider. Its plan, trial quota, and billing terms are controlled by SerpApi, not Vercel. Requests may cost money after any free allowance is exhausted.
- Do not enable more than one Lens request per user search unless you have checked the provider's pricing and quota. Multi-crop or multi-angle searches multiply provider calls.
- Keep the rate limit enabled and monitor provider usage in its dashboard.
- If you require a hard zero-cost deployment, remove/disable the SerpApi-backed search endpoint. There is no honest way to provide web-wide reverse image search for free without access to a web-scale index.

## Recommended manual evaluation

Build a small test set with permission to use every image:

| Set | Example | Expected behavior |
|---|---|---|
| Exact | Same file uploaded twice | Lens may place indexed copies in exact results |
| Transformed | Same image resized, recompressed, or watermarked | May appear in exact or visual results |
| Cropped | Same photo with a substantial crop | May appear in visual results |
| Similar scene | Different person wearing similar clothes in a similar pose | Should not be described as an exact match |
| Unindexed | Original personal photo never published publicly | No web result is a valid outcome |
| Publicly indexed | An image with a known public source page | Check whether that source is returned |

Record for each query: whether the known source was returned, its position, irrelevant results above it, exact/visual group, query time, and provider usage. Evaluate precision at 5 and recall of known source URLs. Do not infer accuracy from the number of results or from celebrity examples alone.

## Important limitations

- Google Lens controls web discovery and result generation. VisuFind cannot force it to index private or unknown images.
- An exact-group result is a provider classification, not an independent pixel-level proof.
- A visual match is not evidence of identity.
- Search results can change as the provider's index changes.
- Finding an image online does not prove ownership or grant reuse rights.
