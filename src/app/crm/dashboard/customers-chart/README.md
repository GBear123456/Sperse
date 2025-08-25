# Customers Chart Component

This component has been updated to use Chart.js directly instead of ngx-charts, with full Angular Material integration for enhanced user experience and consistent styling.

## Features

- **Chart.js Integration**: Uses Chart.js v2.9.4 for better performance and customization
- **Angular Material Components**: Full Material Design integration with date pickers, select dropdowns, and form fields
- **Gradient Backgrounds**: Implements the same gradient styling as the React component
- **Responsive Design**: Maintains the same responsive behavior with `maxWidth: 99%`
- **Material Design Colors**: Uses the same color scheme and theming
- **Smooth Animations**: Includes the same animation duration and easing
- **Smart Date Handling**: Automatic comparison period calculation based on selected date ranges

## Key Changes from ngx-charts

1. **Replaced ngx-charts with Chart.js**: Better performance and more customization options
2. **Added Angular Material Components**: Date pickers, select dropdowns, and form fields
3. **Added Gradient Backgrounds**: Creates linear gradients for chart areas
4. **Improved Tooltips**: Custom tooltip styling matching the React component
5. **Better Responsiveness**: Fixed chart container sizing issues
6. **Enhanced Date Selection**: Multiple date range options with automatic comparison period calculation

## Material Components Used

- **MatFormField**: Form field containers with outline appearance
- **MatSelect**: Dropdown for date range selection
- **MatDatepicker**: Date picker inputs for start and end dates
- **MatInput**: Input fields for date values
- **MatIcon**: Material icons for better visual consistency
- **MatButton**: Button components for date picker toggles

## Usage

```typescript
// In your component
<app-customers-chart
  [title]="'CUSTOMERS'"
  [currentPeriodData]="currentData"
  [comparisonPeriodData]="comparisonData"
  [currentPeriodTotal]="245"
  [percentageChange]="80.15"
  [startDate]="startDate"
  [endDate]="endDate"
  [comparisonStartDate]="comparisonStartDate"
  [comparisonEndDate]="comparisonEndDate">
</app-customers-chart>
```

## Date Range Options

The component supports multiple date range types:
- **Between Dates**: Custom date range with manual start/end date selection
- **Month to Date**: From start of current month to today
- **Quarter to Date**: From start of current quarter to today
- **Year to Date**: From start of current year to today

## Styling

The component maintains the same visual appearance as the React component:
- Maroon line for current period data
- Light blue line for comparison period data
- Gradient backgrounds with opacity
- No grid lines (clean appearance)
- Custom tooltip styling
- Responsive container with `maxWidth: 99%`
- Material Design form fields with consistent styling

## Dependencies

- Chart.js v2.9.4
- Angular Material (FormField, Input, Datepicker, Select, Icon, Button)
- FormsModule for two-way data binding
- No external chart libraries required

## Browser Compatibility

- Modern browsers with Canvas support
- Responsive design for mobile and desktop
- Maintains aspect ratio and responsiveness
- Material Design components with fallback support

## Responsive Behavior

- **Desktop**: Full layout with side-by-side date inputs
- **Tablet**: Stacked layout with full-width form fields
- **Mobile**: Optimized spacing and sizing for small screens
- **Chart**: Automatically adjusts height based on screen size
