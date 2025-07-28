from symspellpy.symspellpy import SymSpell, Verbosity
import pkg_resources
import os

# Set up SymSpell instance
sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)

# Path to dictionary file (adjust this to the actual location in your project)
dictionary_path = os.path.join(os.path.dirname(__file__), "custom_dictionary.txt")

# Load main frequency dictionary
sym_spell.load_dictionary(dictionary_path, term_index=0, count_index=1)

# Optionally, load custom product/brand words (see below)
custom_words_path = os.path.join(os.path.dirname(__file__), "custom_dictionary.txt")
if os.path.exists(custom_words_path):
    sym_spell.load_dictionary(custom_words_path, term_index=0, count_index=1)

def get_corrected_query(query):
    # SymSpell handles phrase corrections out of the box
    suggestions = sym_spell.lookup_compound(query, max_edit_distance=2)
    if suggestions:
        corrected = suggestions[0].term
        if corrected.lower() != query.lower():
            return corrected
    return None
