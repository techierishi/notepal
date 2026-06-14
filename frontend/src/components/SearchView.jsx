import "./SearchView.css";
import { Editor } from "solid-prism-editor";
import "solid-prism-editor/layout.css";
import "solid-prism-editor/themes/github-light.css";

import prism from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-css";

function SearchView(props) {
  return (
    <div class="search-view">
      <div class="search-list">
        <Editor
          class="search-editor"
          value={
            typeof props?.filteredSearchData === "string"
              ? props.filteredSearchData
              : JSON.stringify(props?.filteredSearchData ?? "", null, 2)
          }
          language="text"
          prism={prism}
          placeholder="No data found..."
        />
      </div>
    </div>
  );
}

export default SearchView;