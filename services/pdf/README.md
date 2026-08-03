# PDF Module

## Responsibility

세미나 renderer의 결과를 임시 DOM에 구성하고 브라우저 PDF 엔진 또는 인쇄 fallback으로 전달한다.

## Public API

- `createPdfRenderZone(options)`: mode에 맞는 임시 렌더 영역을 만든다.
- `waitForPdfLayout(documentRef)`: font와 layout 준비를 기다린다.
- `exportSeminarPdf(options)`: PDF 내보내기와 fallback 생명주기를 실행한다.
- `createPdfOptions(topicData, mode)`: A4 옵션과 파일명을 만든다.

## Lifecycle

exporter가 render zone을 만들고 document에 연결한 뒤 layout을 기다린다. 성공, 엔진 오류와 fallback 오류를 포함한 모든 경로에서 `finally`로 임시 DOM을 제거한다.

## Fallback

PDF 엔진이 없으면 페이지가 전달한 callback을 호출한다. 현재 페이지 callback은 같은 topic과 mode의 인쇄 화면을 새 탭으로 연다.

## Errors

render-zone은 사용할 document가 없으면 명시적인 오류를 던진다. exporter는 오류를 숨기지 않고 정리 후 호출자에게 전달한다.

## Dependencies

render-zone은 DOM renderer만 입력받으며 URL이나 PDF 엔진을 알지 않는다. exporter만 PDF 엔진과 옵션을 소유한다.

## Tests

`tests/pdf.test.mjs`가 가로 구조, page break, 옵션, 성공·실패 정리와 fallback을 검증한다.
