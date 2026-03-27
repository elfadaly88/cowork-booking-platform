using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoworkBooking.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceSubscriptionFee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ApprovalPaymentMethodId",
                table: "Workspaces",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovalPaymentPaidAt",
                table: "Workspaces",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApprovalPaymentStatus",
                table: "Workspaces",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyFeeAmount",
                table: "Workspaces",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionEndDate",
                table: "Workspaces",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionStartDate",
                table: "Workspaces",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Workspaces_ApprovalPaymentMethodId",
                table: "Workspaces",
                column: "ApprovalPaymentMethodId");

            migrationBuilder.AddForeignKey(
                name: "FK_Workspaces_PaymentMethods_ApprovalPaymentMethodId",
                table: "Workspaces",
                column: "ApprovalPaymentMethodId",
                principalTable: "PaymentMethods",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workspaces_PaymentMethods_ApprovalPaymentMethodId",
                table: "Workspaces");

            migrationBuilder.DropIndex(
                name: "IX_Workspaces_ApprovalPaymentMethodId",
                table: "Workspaces");

            migrationBuilder.DropColumn(
                name: "ApprovalPaymentMethodId",
                table: "Workspaces");

            migrationBuilder.DropColumn(
                name: "ApprovalPaymentPaidAt",
                table: "Workspaces");

            migrationBuilder.DropColumn(
                name: "ApprovalPaymentStatus",
                table: "Workspaces");

            migrationBuilder.DropColumn(
                name: "MonthlyFeeAmount",
                table: "Workspaces");

            migrationBuilder.DropColumn(
                name: "SubscriptionEndDate",
                table: "Workspaces");

            migrationBuilder.DropColumn(
                name: "SubscriptionStartDate",
                table: "Workspaces");
        }
    }
}
