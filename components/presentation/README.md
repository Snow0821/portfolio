# Presentation Module

## Responsibility

가로 발표와 세로 읽기 화면의 마크업, 반응형 헤더와 가로 이동을 제공한다. 페이지는 주제와 mode를 선택해 이 모듈을 조립한다.

## Public API

- `PresentationController(documentRef)`: 가로 슬라이드의 버튼·키보드 이동과 counter를 관리한다.
- `renderReadingDocument(container, topicData)`: 읽기 문서를 렌더링한다.
- `renderPresentationSlides(container, topicData, options)`: 가로 슬라이드를 렌더링한다.
- `SlideHeader`, `createSlideHeaderMarkup(options)`: mode에 반응하는 `<slide-header>`를 제공한다.

## Lifecycle

페이지가 header 속성을 설정하고 mode에 맞는 renderer를 실행한다. 가로 mode에서만 controller를 생성한다.

## Dependencies

renderer와 header는 `utils/html.js`만 사용한다. 데이터 모듈과 페이지 URL을 직접 import하지 않는다.

## Styles

연결된 공통 스타일은 `styles/components/presentation/`이 소유하며 `header → layout → slide-card → reading-document` 순서로 불러온다. 각 반응형 규칙은 소유 컴포넌트의 파일에 함께 둔다.

## Errors

renderer는 container나 필요한 데이터가 없으면 안전하게 반환한다. topic fallback과 사용자 오류 표시는 페이지가 담당한다.

## Tests

`tests/presentation.test.mjs`가 mode, topic, header와 렌더링 계약을 검증한다. PDF에서 사용하는 renderer 연결은 `tests/pdf.test.mjs`가 확인한다.

## Extension rules

새 slide type은 renderer 테스트와 데스크톱·모바일 layout 검증을 함께 추가한다. 재사용되지 않는 페이지 URL이나 데이터 선택 로직을 이 모듈에 넣지 않는다.
