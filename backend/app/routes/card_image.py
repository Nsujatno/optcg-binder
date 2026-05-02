from __future__ import annotations

from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, Response

from ..dependencies import BackendDependencies, get_backend_dependencies


router = APIRouter(prefix="/api")


@router.get("/card-image")
async def get_card_image(
    url: str = Query(...),
    dependencies: BackendDependencies = Depends(get_backend_dependencies),
) -> Response:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return JSONResponse({"error": "Unsupported image URL protocol."}, status_code=400)

    if parsed.hostname not in dependencies.allowed_card_image_hosts:
        return JSONResponse({"error": "Image host is not allowed."}, status_code=400)

    try:
        async with httpx.AsyncClient(follow_redirects=False, timeout=20.0) as http_client:
            upstream_response = await http_client.get(
                url,
                headers={"Accept": "image/*,*/*;q=0.8"},
            )
    except httpx.HTTPError:
        return JSONResponse({"error": "Could not fetch remote image."}, status_code=502)

    content_type = upstream_response.headers.get("content-type", "")
    if 300 <= upstream_response.status_code < 400:
        return JSONResponse({"error": "Redirected image URLs are not allowed."}, status_code=502)

    if upstream_response.status_code != 200:
        return JSONResponse(
            {"error": f"Remote image request failed with {upstream_response.status_code}."},
            status_code=502,
        )

    if not content_type.startswith("image/"):
        return JSONResponse({"error": "Remote URL did not return an image."}, status_code=415)

    return Response(
        content=upstream_response.content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
    )
