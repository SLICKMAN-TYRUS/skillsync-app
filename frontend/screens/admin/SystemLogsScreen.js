import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { api } from '../../services/api';

const SystemLogsScreen = () => {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, error, info, warning
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/admin/system-logs', {
        params: { filter, search: searchQuery },
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching system logs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const handleSearch = () => {
    fetchLogs();
  };

  const getLogIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'error':
        return { name: 'error', color: '#F44336' };
      case 'warning':
        return { name: 'warning', color: '#FF9800' };
      case 'info':
        return { name: 'info', color: '#2196F3' };
      default:
        return { name: 'fiber-manual-record', color: '#757575' };
    }
  };

  const FilterButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderLogItem = ({ item }) => {
    const icon = getLogIcon(item.type);
    return (
      <View style={styles.logItem}>
        <View style={styles.logHeader}>
          <View style={styles.logType}>
            <Icon name={icon.name} size={20} color={icon.color} />
            <Text style={[styles.logTypeText, { color: icon.color }]}>
              {item.type}
            </Text>
          </View>
          <Text style={styles.logTimestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.logMessage}>{item.message}</Text>
        <View style={styles.logDetails}>
          <Text style={styles.logSource}>
            <Icon name="code" size={16} color="#666666" /> {item.source}
          </Text>
          <Text style={styles.logUser}>
            <Icon name="person" size={16} color="#666666" /> {item.user}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={24} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <FilterButton title="All" value="all" />
        <FilterButton title="Errors" value="error" />
        <FilterButton title="Warnings" value="warning" />
        <FilterButton title="Info" value="info" />
      </View>

      <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchLogs} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="assignment" size={48} color="#666666" />
            <Text style={styles.emptyText}>No logs found</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 8,
  },
  searchButton: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filters: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  filterButtonText: {
    color: '#666666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#0066CC',
  },
  listContainer: {
    padding: 16,
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTypeText: {
    marginLeft: 8,
    fontWeight: '500',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  logTimestamp: {
    color: '#666666',
    fontSize: 12,
  },
  logMessage: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
  },
  logSource: {
    fontSize: 12,
    color: '#666666',
  },
  logUser: {
    fontSize: 12,
    color: '#666666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});

export default SystemLogsScreen;
