import "./SearchView.css";
import { Editor } from "solid-prism-editor";
import "solid-prism-editor/layout.css";
import "solid-prism-editor/themes/github-light.css";

import "solid-prism-editor/prism/languages/markdown";
import "solid-prism-editor/prism/languages/css";
import "solid-prism-editor/prism/languages/json"; 

function SearchView(props) {
  const getLanguage = () => {
    if (typeof props.filteredSearchData === "string") {
      return "markdown";
    }
    return "json";
  };

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
          language={getLanguage()}
          placeholder="No data found..."
        />
      </div>
    </div>
  );
}

export default SearchView;
