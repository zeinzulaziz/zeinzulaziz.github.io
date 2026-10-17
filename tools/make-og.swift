// Render assets/img/og.jpg (1200x630) in the warm monochrome direction:
// dark paper (#181511), chalk ink (#f4f1e7), one hairline rule, dot grid.
// No hue anywhere — differentiation comes from tone only. See DESIGN.md.
import Foundation
import CoreGraphics
import CoreText
import ImageIO

let W = 1200, H = 630
let paper = CGColor(red: 0.094, green: 0.082, blue: 0.067, alpha: 1)      // #181511
let ink = CGColor(red: 0.957, green: 0.945, blue: 0.906, alpha: 1)        // #f4f1e7
let inkSoft = CGColor(red: 0.710, green: 0.694, blue: 0.635, alpha: 1)    // #b5b1a2
let inkFaint = CGColor(red: 0.580, green: 0.561, blue: 0.494, alpha: 1)   // #948f7e

guard let ctx = CGContext(
    data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
) else { fatalError("context") }

ctx.setFillColor(paper)
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))

// Subtle dot grid, same rhythm as the old OG but tone-on-tone.
ctx.setFillColor(CGColor(red: 0.173, green: 0.161, blue: 0.125, alpha: 1))
for x in stride(from: 24, to: W, by: 40) {
    for y in stride(from: 24, to: H, by: 40) {
        ctx.fill(CGRect(x: x, y: y, width: 2, height: 2))
    }
}

func drawText(_ s: String, size: CGFloat, x: Int, y: Int, font: String, color: CGColor) {
    guard let f = CTFontCreateWithName(font as CFString, size, nil) as CTFont? else { return }
    let attrs: [String: Any] = [kCTFontAttributeName as String: f,
                                kCTForegroundColorAttributeName as String: color]
    guard let attr = CFAttributedStringCreate(nil, s as CFString, attrs as CFDictionary) else { return }
    let line = CTLineCreateWithAttributedString(attr)
    ctx.textPosition = CGPoint(x: CGFloat(x), y: CGFloat(y))
    CTLineDraw(line, ctx)
}

// Brand tag (mono, metadata voice)
drawText("zeinzulaziz.github.io", size: 28, x: 80, y: H - 84, font: "Menlo-Regular", color: inkFaint)
// The one inversion gesture: a small chalk block, the same accent discipline
// as the site (index plates, primary button).
ctx.setFillColor(ink)
ctx.fill(CGRect(x: 80, y: H - 190, width: 76, height: 6))
// Name in display weight, role and lede below in quieter tones.
drawText("Moh Zein Zulfanul Aziz", size: 64, x: 80, y: H - 280, font: "HelveticaNeue-Bold", color: ink)
drawText("WordPress Developer · Solo AI Product Builder", size: 30, x: 80, y: H - 334,
         font: "HelveticaNeue-Medium", color: inkSoft)
drawText("Small products with AI — Harga Pangan, Convert Gold, and more.", size: 25,
         x: 80, y: H - 384, font: "HelveticaNeue-Regular", color: inkFaint)

guard let image = ctx.makeImage() else { fatalError("makeImage") }
let outURL = URL(fileURLWithPath: "assets/img/og.jpg") as CFURL
guard let dest = CGImageDestinationCreateWithURL(outURL, "public.jpeg" as CFString, 1, nil) else {
    fatalError("dest")
}
let opts: [String: Any] = [kCGImageDestinationLossyCompressionQuality as String: 0.85]
CGImageDestinationAddImage(dest, image, opts as CFDictionary)
guard CGImageDestinationFinalize(dest) else { fatalError("finalize") }
print("wrote assets/img/og.jpg \(W)x\(H)")
