$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$requiredFiles = @(
    "seminar.html",
    "components/section-include.js",
    "sections/about.html",
    "sections/research.html",
    "sections/career.html",
    "sections/academic.html",
    "styles/style.css",
    "styles/tokens.css",
    "styles/base.css",
    "styles/layout.css",
    "styles/components/header.css",
    "styles/components/intro.css",
    "styles/components/seminar.css",
    "styles/components/section.css",
    "styles/components/entry.css",
    "styles/print.css"
)

foreach ($relativePath in $requiredFiles) {
    $absolutePath = Join-Path $projectRoot $relativePath

    if (-not (Test-Path -LiteralPath $absolutePath)) {
        throw "Missing required file: $relativePath"
    }
}

$index = Get-Content -Raw -Encoding UTF8 (Join-Path $projectRoot "index.html")
$expectedReferences = @(
    "./styles/style.css",
    "./components/section-include.js",
    "./sections/about.html",
    "./sections/research.html",
    "./sections/career.html",
    "./sections/academic.html"
)

foreach ($reference in $expectedReferences) {
    if (-not $index.Contains($reference)) {
        throw "index.html does not reference: $reference"
    }
}

if (-not $index.Contains("./seminar.html")) {
    throw "index.html does not link to the seminar page."
}

$seminar = Get-Content -Raw -Encoding UTF8 (Join-Path $projectRoot "seminar.html")
$expectedSeminarContent = @(
    "./index.html",
    "./seminar.html",
    "./styles/style.css",
    "<main class=`"seminars`">",
    "<h1>Seminars</h1>"
)

foreach ($content in $expectedSeminarContent) {
    if (-not $seminar.Contains($content)) {
        throw "seminar.html does not contain: $content"
    }
}

Write-Output "Structure verification passed."
