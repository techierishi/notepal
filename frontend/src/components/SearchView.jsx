import { For, Show } from 'solid-js';
import './SearchView.css';


function SearchView(props) {
  return (
    <div class="search-view">
      <div class="search-list">
        <For each={props.filteredSearchData}>
          {(item, index) => (
            <div
              class={`search-item${index() === props.searchSelectedIndex ? ' selected' : ''}`}
              onClick={() => props.onItemClick(item)}
            >
              <div class={`search-text${item.is_secret ? ' masked' : ''}`}>
                {item.content || item.text || 'No content'}
              </div>
              <div class="search-meta">
                <span class="search-type">{item.type || 'text'}</span>
                <div class="search-meta-right">

                  <span class="search-id">
                    {item.id ? item.id : ''}
                  </span>
                </div>
              </div>
            </div>
          )}
        </For>
        <Show when={props.filteredSearchData?.length === 0}>
          <div class="search-empty">
            {props.searchData.length > 0 ? 'No matching items' : 'Search is empty'}
          </div>
        </Show>
      </div>
    </div>
  );
}

export default SearchView;


