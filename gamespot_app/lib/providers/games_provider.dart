import 'package:flutter/material.dart';
import '../services/api_service.dart';

/// GamesProvider — manages games library state
class GamesProvider extends ChangeNotifier {
  final ApiService _api = ApiService.instance;

  List<Map<String, dynamic>> _games = [];
  List<Map<String, dynamic>> _recommendations = [];
  bool _loading = false;
  String? _error;
  String _activeFilter = 'all';
  String _searchQuery = '';

  // Getters
  List<Map<String, dynamic>> get games => _filteredGames;
  List<Map<String, dynamic>> get allGames => _games;
  List<Map<String, dynamic>> get recommendations => _recommendations;
  bool get loading => _loading;
  String? get error => _error;
  String get activeFilter => _activeFilter;
  String get searchQuery => _searchQuery;

  List<Map<String, dynamic>> get _filteredGames {
    var filtered = _games;
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      filtered = filtered.where((g) {
        return (g['name'] ?? '').toString().toLowerCase().contains(q) ||
            (g['genre'] ?? '').toString().toLowerCase().contains(q);
      }).toList();
    }
    return filtered;
  }

  List<String> get genres {
    final genreSet = <String>{};
    for (final g in _games) {
      if (g['genre'] != null && g['genre'].toString().isNotEmpty) {
        genreSet.add(g['genre']);
      }
    }
    return genreSet.toList()..sort();
  }

  void setFilter(String filter) {
    _activeFilter = filter;
    notifyListeners();
    loadGames();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> loadAll() async {
    await Future.wait([loadGames(), loadRecommendations()]);
  }

  Future<void> loadGames() async {
    try {
      _loading = true;
      _error = null;
      notifyListeners();

      final ps5Filter = _activeFilter == 'all' ? null : _activeFilter;
      final response = await _api.getGames(ps5Filter: ps5Filter);
      _games = List<Map<String, dynamic>>.from(response['games'] ?? []);
    } catch (e) {
      _error = 'Failed to load games. Please try again.';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> loadRecommendations() async {
    try {
      final response = await _api.getRecommendations();
      _recommendations =
          List<Map<String, dynamic>>.from(response['recommendations'] ?? []);
      notifyListeners();
    } catch (e) {
      // Silent fail
    }
  }

  Future<bool> voteForGame(int recommendationId) async {
    try {
      await _api.voteForGame(recommendationId);
      await loadRecommendations();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> recommendGame(String gameName, {String description = ''}) async {
    try {
      await _api.recommendGame(gameName, description: description);
      await loadRecommendations();
      return true;
    } catch (e) {
      return false;
    }
  }
}
