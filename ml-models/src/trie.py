# src/trie.py

class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False
        self.phrase = None

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, phrase):
        node = self.root
        phrase_norm = phrase.strip().lower()
        for char in phrase_norm:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True
        node.phrase = phrase.strip()

    def search_prefix(self, prefix, max_results=10):
        node = self.root
        results = []
        prefix_norm = prefix.strip().lower()
        for char in prefix_norm:
            if char not in node.children:
                return []
            node = node.children[char]
        self._dfs(node, results, max_results)
        return results

    def _dfs(self, node, results, max_results):
        if len(results) >= max_results:
            return
        if node.is_end_of_word and node.phrase:
            results.append(node.phrase)
            if len(results) >= max_results:
                return
        for child in node.children.values():
            self._dfs(child, results, max_results)
            if len(results) >= max_results:
                break
