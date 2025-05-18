import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

interface DateRange {
  start: string;
  end: string;
}

interface PaymentMethodStats {
  count: number;
  total: number;
}

interface DailyRevenue {
  _id: string;
  revenue: number;
  orderCount: number;
}

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  paymentMethodStats: Record<string, PaymentMethodStats>;
  dailyRevenue: DailyRevenue[];
  dateRange: DateRange;
}

const DetailedReport = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const reportData: RevenueData = JSON.parse(params.reportData as string);

  const formatCurrency = (amount: number): string => {
    return `PKR ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <AntDesign 
          onPress={() => router.back()} 
          name="arrowleft" 
          size={26} 
          color="#4E1365" 
          style={styles.backArrow} 
        />
        <Text style={styles.headerText}>Detailed Revenue Report</Text>

        <ScrollView style={styles.scrollView}>
          {/* Overview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.dateRange}>
              Period: {formatDate(reportData.dateRange.start)} to {formatDate(reportData.dateRange.end)}
            </Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Revenue:</Text>
              <Text style={styles.statValue}>{formatCurrency(reportData.totalRevenue)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Orders:</Text>
              <Text style={styles.statValue}>{reportData.totalOrders}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Average Order Value:</Text>
              <Text style={styles.statValue}>{formatCurrency(reportData.averageOrderValue)}</Text>
            </View>
          </View>

          {/* Payment Methods Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            {Object.entries(reportData.paymentMethodStats).map(([method, stats]) => (
              <View key={method} style={styles.paymentMethod}>
                <Text style={styles.methodName}>{method.toUpperCase()}</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Orders:</Text>
                  <Text style={styles.statValue}>{stats.count}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total:</Text>
                  <Text style={styles.statValue}>{formatCurrency(stats.total)}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Daily Revenue Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Revenue</Text>
            {reportData.dailyRevenue.map((day) => (
              <View key={day._id} style={styles.dayStats}>
                <Text style={styles.dayDate}>{formatDate(day._id)}</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Revenue:</Text>
                  <Text style={styles.statValue}>{formatCurrency(day.revenue)}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Orders:</Text>
                  <Text style={styles.statValue}>{day.orderCount}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4A006E",
    padding: 10
  },
  innerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    color: '#4E1365',
    textAlign: 'center',
    padding: 16,
    marginTop: 20,
  },
  backArrow: {
    position: 'absolute',
    top: 23,
    left: 10,
    zIndex: 2,
  },
  section: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4E1365',
    marginBottom: 12,
  },
  dateRange: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4E1365',
  },
  paymentMethod: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 2,
  },
  methodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E1365',
    marginBottom: 8,
  },
  dayStats: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 2,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4E1365',
    marginBottom: 8,
  },
});

export default DetailedReport; 