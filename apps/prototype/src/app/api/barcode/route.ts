import { NextRequest, NextResponse } from "next/server";
import { resolveBarcode } from "@/lib/barcode-resolve";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  if (!code.trim()) {
    return NextResponse.json({ error: "code fehlt" }, { status: 400 });
  }

  try {
    const product = await resolveBarcode(code);
    if (!product) {
      return NextResponse.json(
        {
          product: null,
          message:
            "Barcode unbekannt — keine Treffer in Demo-Katalog oder Open Food Facts. Name manuell tippen.",
        },
        { status: 404 },
      );
    }
    return NextResponse.json({
      product,
      source: "lookup",
    });
  } catch {
    return NextResponse.json(
      { error: "Produkt-Lookup fehlgeschlagen" },
      { status: 502 },
    );
  }
}
