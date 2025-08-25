# Customers Chart Component

This component has been updated to use Chart.js directly instead of ngx-charts, matching the styling and behavior of the original React component.

## Features

- **Chart.js Integration**: Uses Chart.js v2.9.4 for better performance and customization
- **Gradient Backgrounds**: Implements the same gradient styling as the React component
- **Responsive Design**: Maintains the same responsive behavior with `maxWidth: 99%`
- **Material Design Colors**: Uses the same color scheme and theming
- **Smooth Animations**: Includes the same animation duration and easing

## Key Changes from ngx-charts

1. **Replaced ngx-charts with Chart.js**: Better performance and more customization options
2. **Added Gradient Backgrounds**: Creates linear gradients for chart areas
3. **Improved Tooltips**: Custom tooltip styling matching the React component
4. **Better Responsiveness**: Fixed chart container sizing issues

## Usage

```typescript
// In your component
<app-customers-chart
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

## Styling

The component maintains the same visual appearance as the React component:
- Maroon line for current period data
- Light blue line for comparison period data
- Gradient backgrounds with opacity
- No grid lines (clean appearance)
- Custom tooltip styling
- Responsive container with `maxWidth: 99%`

## Dependencies

- Chart.js v2.9.4
- Angular Material (for theming)
- No external chart libraries required

## Browser Compatibility

- Modern browsers with Canvas support
- Responsive design for mobile and desktop
- Maintains aspect ratio and responsiveness
